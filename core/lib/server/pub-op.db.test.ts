import { describe, expect, expectTypeOf, it, vitest } from "vitest";

import type { PubsId, PubTypes, Stages } from "db/public";
import { CoreSchemaType, MemberRole } from "db/public";

import { mockServerCode } from "~/lib/__tests__/utils";
import { createLastModifiedBy } from "../lastModifiedBy";
import { PubOp } from "./pub-op";

const { createSeed, seedCommunity } = await import("~/prisma/seed/seedCommunity");

const { createForEachMockedTransaction } = await mockServerCode();

const seed = createSeed({
	community: {
		name: "test",
		slug: "test-server-pub",
	},
	users: {
		admin: {
			role: MemberRole.admin,
		},
		stageEditor: {
			role: MemberRole.contributor,
		},
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Description: { schemaName: CoreSchemaType.String },
		"Some relation": { schemaName: CoreSchemaType.String, relation: true },
		"Another relation": { schemaName: CoreSchemaType.String, relation: true },
	},
	pubTypes: {
		"Basic Pub": {
			Title: { isTitle: true },
			"Some relation": { isTitle: false },
			"Another relation": { isTitle: false },
		},
		"Minimal Pub": {
			Title: { isTitle: true },
		},
	},
	stages: {
		"Stage 1": {
			members: {
				stageEditor: MemberRole.editor,
			},
		},
	},
	pubs: [
		{
			pubType: "Basic Pub",
			values: {
				Title: "Some title",
			},
			stage: "Stage 1",
		},
		{
			pubType: "Basic Pub",
			values: {
				Title: "Another title",
			},
			relatedPubs: {
				"Some relation": [
					{
						value: "test relation value",
						pub: {
							pubType: "Basic Pub",
							values: {
								Title: "A pub related to another Pub",
							},
						},
					},
				],
			},
		},
		{
			stage: "Stage 1",
			pubType: "Minimal Pub",
			values: {
				Title: "Minimal pub",
			},
		},
	],
});

const { community, pubFields, pubTypes, stages, pubs, users } = await seedCommunity(seed);

describe("PubOp", () => {
	it("should create a new pub", async () => {
		const id = crypto.randomUUID() as PubsId;
		const pubOp = PubOp.upsert(id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const pub = await pubOp.execute();
		await expect(pub.id).toExist();
	});

	it("should not fail when upserting existing pub", async () => {
		const id = crypto.randomUUID() as PubsId;
		const pubOp = PubOp.upsert(id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const pub = await pubOp.execute();
		await expect(pub.id).toExist();

		const pub2 = await PubOp.upsert(id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		}).execute();

		await expect(pub2.id).toExist();
	});

	it("should create a new pub and set values", async () => {
		const id = crypto.randomUUID() as PubsId;
		const pubOp = PubOp.upsert(id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Some title")
			.set({
				[pubFields["Description"].slug]: "Some description",
			});

		const pub = await pubOp.execute();
		await expect(pub.id).toExist();

		expect(pub).toHaveValues([
			{
				fieldSlug: pubFields["Description"].slug,
				value: "Some description",
			},
			{
				fieldSlug: pubFields["Title"].slug,
				value: "Some title",
			},
		]);
	});

	it("should be able to relate existing pubs", async () => {
		const pubOp = PubOp.upsert(crypto.randomUUID() as PubsId, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const pub = await pubOp.execute();

		await expect(pub.id).toExist();

		const pub2 = await PubOp.upsert(crypto.randomUUID() as PubsId, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.connect(pubFields["Some relation"].slug, pub.id, "test relations value")
			.execute();

		await expect(pub2.id).toExist();
		expect(pub2).toHaveValues([
			{
				fieldSlug: pubFields["Some relation"].slug,
				value: "test relations value",
				relatedPubId: pub.id,
			},
		]);
	});

	it("should create multiple related pubs in a single operation", async () => {
		const mainPub = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Main Pub")
			.connect(
				pubFields["Some relation"].slug,
				PubOp.create({
					communityId: community.id,
					pubTypeId: pubTypes["Basic Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
				}).set(pubFields["Title"].slug, "Related Pub 1"),
				"the first related pub"
			)
			.connect(
				pubFields["Another relation"].slug,
				PubOp.create({
					communityId: community.id,
					pubTypeId: pubTypes["Basic Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
				}).set(pubFields["Title"].slug, "Related Pub 2"),
				"the second related pub"
			);

		const result = await mainPub.execute();

		expect(result).toHaveValues([
			{ fieldSlug: pubFields["Title"].slug, value: "Main Pub" },
			{
				fieldSlug: pubFields["Some relation"].slug,
				value: "the first related pub",
				relatedPubId: expect.any(String),
			},
			{
				fieldSlug: pubFields["Another relation"].slug,
				value: "the second related pub",
				relatedPubId: expect.any(String),
			},
		]);
	});

	it("should handle deeply nested relations", async () => {
		const relatedPub = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Level 1")
			.connect(
				pubFields["Another relation"].slug,
				PubOp.create({
					communityId: community.id,
					pubTypeId: pubTypes["Basic Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
				}).set(pubFields["Title"].slug, "Level 2"),
				"the second related pub"
			);

		const mainPub = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Root")
			.connect(pubFields["Some relation"].slug, relatedPub, "the first related pub");

		const result = await mainPub.execute();

		expect(result).toHaveValues([
			{ fieldSlug: pubFields["Title"].slug, value: "Root" },
			{
				fieldSlug: pubFields["Some relation"].slug,
				value: "the first related pub",
				relatedPubId: expect.any(String),
				relatedPub: {
					values: [
						{
							fieldSlug: pubFields["Title"].slug,
							value: "Level 1",
						},
						{
							fieldSlug: pubFields["Another relation"].slug,
							value: "the second related pub",
							relatedPubId: expect.any(String),
						},
					],
				},
			},
		]);
	});

	it("should handle mixing existing and new pubs in relations", async () => {
		// First create a pub that we'll relate to
		const existingPub = await PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Existing Pub")
			.execute();

		const mainPub = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Main Pub")
			.connect(pubFields["Some relation"].slug, existingPub.id, "the first related pub")
			.connect(
				pubFields["Another relation"].slug,
				PubOp.create({
					communityId: community.id,
					pubTypeId: pubTypes["Basic Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
				}).set(pubFields["Title"].slug, "New Related Pub"),
				"the second related pub"
			);

		const result = await mainPub.execute();

		expect(result).toHaveValues([
			{ fieldSlug: pubFields["Title"].slug, value: "Main Pub" },
			{
				fieldSlug: pubFields["Some relation"].slug,
				value: "the first related pub",
				relatedPubId: existingPub.id,
				relatedPub: {
					id: existingPub.id,
					values: [{ fieldSlug: pubFields["Title"].slug, value: "Existing Pub" }],
				},
			},
			{
				fieldSlug: pubFields["Another relation"].slug,
				value: "the second related pub",
				relatedPubId: expect.any(String),
				relatedPub: {
					values: [{ fieldSlug: pubFields["Title"].slug, value: "New Related Pub" }],
				},
			},
		]);
	});

	it("should handle circular relations", async () => {
		const pub1 = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		}).set(pubFields["Title"].slug, "Pub 1");

		const pub2 = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Pub 2")
			.connect(pubFields["Some relation"].slug, pub1, "the first related pub");

		pub1.connect(pubFields["Another relation"].slug, pub2, "the second related pub");

		const result = await pub1.execute();

		expect(result).toHaveValues([
			{ fieldSlug: pubFields["Title"].slug, value: "Pub 1" },
			{
				fieldSlug: pubFields["Another relation"].slug,
				value: "the second related pub",
				relatedPubId: expect.any(String),
				relatedPub: {
					values: [
						{ fieldSlug: pubFields["Title"].slug, value: "Pub 2" },
						{
							fieldSlug: pubFields["Some relation"].slug,
							value: "the first related pub",
							relatedPubId: result.id,
						},
					],
				},
			},
		]);
	});

	it("should fail if you try to createWithId a pub that already exists", async () => {
		const pubOp = PubOp.createWithId(pubs[0].id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		});

		await expect(pubOp.execute()).rejects.toThrow(
			/Cannot create a pub with an id that already exists/
		);
	});

	it("should update the value of a relationship", async () => {
		const pub1 = await PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Pub 1")
			.execute();

		const pub2 = await PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Pub 2")
			.connect(pubFields["Some relation"].slug, pub1.id, "initial value")
			.execute();

		const updatedPub = await PubOp.upsert(pub2.id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.connect(pubFields["Some relation"].slug, pub1.id, "updated value")
			.execute();

		expect(updatedPub).toHaveValues([
			{ fieldSlug: pubFields["Title"].slug, value: "Pub 2" },
			{
				fieldSlug: pubFields["Some relation"].slug,
				value: "updated value",
				relatedPubId: pub1.id,
			},
		]);
	});
});

describe("relation management", () => {
	it("should disconnect a specific relation", async () => {
		// Create two pubs to relate
		const pub1 = await PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Pub 1")
			.execute();

		const pub2 = await PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Pub 2")
			.connect(pubFields["Some relation"].slug, pub1.id, "initial value")
			.execute();

		// Disconnect the relation
		const updatedPub = await PubOp.update(pub2.id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.disconnect(pubFields["Some relation"].slug, pub1.id)
			.execute();

		expect(updatedPub).toHaveValues([{ fieldSlug: pubFields["Title"].slug, value: "Pub 2" }]);
	});

	it("should delete orphaned pubs when disconnecting relations", async () => {
		// Create a pub that will become orphaned
		const orphanedPub = await PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Soon to be orphaned")
			.execute();

		// Create a pub that relates to it
		const mainPub = await PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Main pub")
			.connect(pubFields["Some relation"].slug, orphanedPub.id, "only relation")
			.execute();

		// Disconnect with deleteOrphaned option
		await PubOp.update(mainPub.id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.disconnect(pubFields["Some relation"].slug, orphanedPub.id, { deleteOrphaned: true })
			.execute();

		await expect(orphanedPub.id).not.toExist();
	});

	it("should clear all relations for a specific field", async () => {
		// Create multiple related pubs
		const related1 = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		}).set(pubFields["Title"].slug, "Related 1");

		const related2 = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		}).set(pubFields["Title"].slug, "Related 2");

		// Create main pub with multiple relations
		const mainPub = await PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Main pub")
			.connect(pubFields["Some relation"].slug, related1, "relation 1")
			.connect(pubFields["Some relation"].slug, related2, "relation 2")
			.execute();

		// Clear all relations for the field
		const updatedPub = await PubOp.update(mainPub.id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.clearRelationsForField(pubFields["Some relation"].slug)
			.execute();

		expect(updatedPub).toHaveValues([
			{ fieldSlug: pubFields["Title"].slug, value: "Main pub" },
		]);
	});

	it("should override existing relations when using override option", async () => {
		// Create initial related pubs
		const related1 = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		}).set(pubFields["Title"].slug, "Related 1");

		const related2 = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		}).set(pubFields["Title"].slug, "Related 2");

		// Create main pub with initial relations
		const mainPub = await PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Main pub")
			.connect(pubFields["Some relation"].slug, related1, "relation 1")
			.connect(pubFields["Some relation"].slug, related2, "relation 2")
			.execute();

		const relatedPub1 = mainPub.values.find((v) => v.value === "relation 1")?.relatedPubId;
		const relatedPub2 = mainPub.values.find((v) => v.value === "relation 2")?.relatedPubId;
		expect(relatedPub1).toBeDefined();
		expect(relatedPub2).toBeDefined();
		await expect(relatedPub1).toExist();
		await expect(relatedPub2).toExist();

		const related3 = await PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Related 3")
			.execute();

		// Update with override - only related3 should remain
		const updatedPub = await PubOp.upsert(mainPub.id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.connect(pubFields["Some relation"].slug, related3.id, "new relation", {
				override: true,
			})
			.execute();

		expect(updatedPub).toHaveValues([
			{ fieldSlug: pubFields["Title"].slug, value: "Main pub" },
			{
				fieldSlug: pubFields["Some relation"].slug,
				value: "new relation",
				relatedPubId: related3.id,
			},
		]);

		// related pubs should still exist
		await expect(relatedPub1).toExist();
		await expect(relatedPub2).toExist();
	});

	it("should handle multiple override relations for the same field", async () => {
		// Create related pubs
		const related1 = await PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Related 1")
			.execute();

		const related2 = await PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Related 2")
			.execute();

		// Create main pub and set multiple relations with override
		const mainPub = await PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(pubFields["Title"].slug, "Main pub")
			.connect(pubFields["Some relation"].slug, related1.id, "relation 1", { override: true })
			.execute();

		const updatedMainPub = await PubOp.update(mainPub.id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.connect(pubFields["Some relation"].slug, related2.id, "relation 2", { override: true })
			.connect(
				pubFields["Some relation"].slug,
				PubOp.create({
					communityId: community.id,
					pubTypeId: pubTypes["Basic Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
				}),
				"relation 3",
				{ override: true }
			)
			.execute();

		// Should have relation 2 and 3, but not 1
		expect(updatedMainPub).toHaveValues([
			{ fieldSlug: pubFields["Title"].slug, value: "Main pub" },
			{
				fieldSlug: pubFields["Some relation"].slug,
				value: "relation 2",
				relatedPubId: related2.id,
			},
			{
				fieldSlug: pubFields["Some relation"].slug,
				value: "relation 3",
				relatedPubId: expect.any(String),
			},
		]);
	});
});
