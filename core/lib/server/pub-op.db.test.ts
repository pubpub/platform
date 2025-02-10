import { tr } from "date-fns/locale";
import { beforeAll, beforeEach, describe, expect, expectTypeOf, it, vitest } from "vitest";

import type { PubsId, PubTypes, Stages } from "db/public";
import { CoreSchemaType, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import type { seedCommunity } from "~/prisma/seed/seedCommunity";
import { mockServerCode } from "~/lib/__tests__/utils";
import { createLastModifiedBy } from "../lastModifiedBy";
import { PubOp } from "./pub-op";

const { createSeed } = await import("~/prisma/seed/createSeed");

const { createForEachMockedTransaction } = await mockServerCode();
const { getTrx, rollback, commit } = createForEachMockedTransaction();

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
		"Stage 2": {
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

let seededCommunity: CommunitySeedOutput<typeof seed>;

beforeAll(async () => {
	const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
	seededCommunity = await seedCommunity(seed);
});

describe("PubOp", () => {
	it("should create a new pub", async () => {
		const id = crypto.randomUUID() as PubsId;
		const pubOp = PubOp.upsert(id, {
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const pub = await pubOp.execute();
		await expect(pub.id).toExist();
	});

	it("should not fail when upserting existing pub", async () => {
		const id = crypto.randomUUID() as PubsId;
		const pubOp = PubOp.upsert(id, {
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const pub = await pubOp.execute();
		await expect(pub.id).toExist();

		const pub2 = await PubOp.upsert(id, {
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		}).execute();

		await expect(pub2.id).toExist();
	});

	it("should create a new pub and set values", async () => {
		const id = crypto.randomUUID() as PubsId;
		const pubOp = PubOp.upsert(id, {
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Some title")
			.set({
				[seededCommunity.pubFields["Description"].slug]: "Some description",
			});

		const pub = await pubOp.execute();
		await expect(pub.id).toExist();

		expect(pub).toHaveValues([
			{
				fieldSlug: seededCommunity.pubFields["Description"].slug,
				value: "Some description",
			},
			{
				fieldSlug: seededCommunity.pubFields["Title"].slug,
				value: "Some title",
			},
		]);
	});

	it("should be able to relate existing pubs", async () => {
		const pubOp = PubOp.upsert(crypto.randomUUID() as PubsId, {
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const pub = await pubOp.execute();

		await expect(pub.id).toExist();

		const pub2 = await PubOp.upsert(crypto.randomUUID() as PubsId, {
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.connect(
				seededCommunity.pubFields["Some relation"].slug,
				pub.id,
				"test relations value"
			)
			.execute();

		await expect(pub2.id).toExist();
		expect(pub2).toHaveValues([
			{
				fieldSlug: seededCommunity.pubFields["Some relation"].slug,
				value: "test relations value",
				relatedPubId: pub.id,
			},
		]);
	});

	it("should create multiple related pubs in a single operation", async () => {
		const mainPub = PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Main Pub")
			.connect(
				seededCommunity.pubFields["Some relation"].slug,
				PubOp.create({
					communityId: seededCommunity.community.id,
					pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
				}).set(seededCommunity.pubFields["Title"].slug, "Related Pub 1"),
				"the first related pub"
			)
			.connect(
				seededCommunity.pubFields["Another relation"].slug,
				PubOp.create({
					communityId: seededCommunity.community.id,
					pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
				}).set(seededCommunity.pubFields["Title"].slug, "Related Pub 2"),
				"the second related pub"
			);

		const result = await mainPub.execute();

		expect(result).toHaveValues([
			{ fieldSlug: seededCommunity.pubFields["Title"].slug, value: "Main Pub" },
			{
				fieldSlug: seededCommunity.pubFields["Some relation"].slug,
				value: "the first related pub",
				relatedPubId: expect.any(String),
			},
			{
				fieldSlug: seededCommunity.pubFields["Another relation"].slug,
				value: "the second related pub",
				relatedPubId: expect.any(String),
			},
		]);
	});

	it("should handle deeply nested relations", async () => {
		const relatedPub = PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Level 1")
			.connect(
				seededCommunity.pubFields["Another relation"].slug,
				PubOp.create({
					communityId: seededCommunity.community.id,
					pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
				}).set(seededCommunity.pubFields["Title"].slug, "Level 2"),
				"the second related pub"
			);

		const mainPub = PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Root")
			.connect(
				seededCommunity.pubFields["Some relation"].slug,
				relatedPub,
				"the first related pub"
			);

		const result = await mainPub.execute();

		expect(result).toHaveValues([
			{ fieldSlug: seededCommunity.pubFields["Title"].slug, value: "Root" },
			{
				fieldSlug: seededCommunity.pubFields["Some relation"].slug,
				value: "the first related pub",
				relatedPubId: expect.any(String),
				relatedPub: {
					values: [
						{
							fieldSlug: seededCommunity.pubFields["Title"].slug,
							value: "Level 1",
						},
						{
							fieldSlug: seededCommunity.pubFields["Another relation"].slug,
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
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Existing Pub")
			.execute();

		const mainPub = PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Main Pub")
			.connect(
				seededCommunity.pubFields["Some relation"].slug,
				existingPub.id,
				"the first related pub"
			)
			.connect(
				seededCommunity.pubFields["Another relation"].slug,
				PubOp.create({
					communityId: seededCommunity.community.id,
					pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
				}).set(seededCommunity.pubFields["Title"].slug, "New Related Pub"),
				"the second related pub"
			);

		const result = await mainPub.execute();

		expect(result).toHaveValues([
			{ fieldSlug: seededCommunity.pubFields["Title"].slug, value: "Main Pub" },
			{
				fieldSlug: seededCommunity.pubFields["Some relation"].slug,
				value: "the first related pub",
				relatedPubId: existingPub.id,
				relatedPub: {
					id: existingPub.id,
					values: [
						{
							fieldSlug: seededCommunity.pubFields["Title"].slug,
							value: "Existing Pub",
						},
					],
				},
			},
			{
				fieldSlug: seededCommunity.pubFields["Another relation"].slug,
				value: "the second related pub",
				relatedPubId: expect.any(String),
				relatedPub: {
					values: [
						{
							fieldSlug: seededCommunity.pubFields["Title"].slug,
							value: "New Related Pub",
						},
					],
				},
			},
		]);
	});

	it("should handle circular relations", async () => {
		const pub1 = PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		}).set(seededCommunity.pubFields["Title"].slug, "Pub 1");

		const pub2 = PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Pub 2")
			.connect(
				seededCommunity.pubFields["Some relation"].slug,
				pub1,
				"the first related pub"
			);

		pub1.connect(
			seededCommunity.pubFields["Another relation"].slug,
			pub2,
			"the second related pub"
		);

		const result = await pub1.execute();

		expect(result).toHaveValues([
			{ fieldSlug: seededCommunity.pubFields["Title"].slug, value: "Pub 1" },
			{
				fieldSlug: seededCommunity.pubFields["Another relation"].slug,
				value: "the second related pub",
				relatedPubId: expect.any(String),
				relatedPub: {
					values: [
						{ fieldSlug: seededCommunity.pubFields["Title"].slug, value: "Pub 2" },
						{
							fieldSlug: seededCommunity.pubFields["Some relation"].slug,
							value: "the first related pub",
							relatedPubId: result.id,
						},
					],
				},
			},
		]);
	});

	it("should fail if you try to createWithId a pub that already exists", async () => {
		const pubOp = PubOp.createWithId(seededCommunity.pubs[0].id, {
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		});

		await expect(pubOp.execute()).rejects.toThrow(
			/Cannot create a pub with an id that already exists/
		);
	});

	it("should update the value of a relationship", async () => {
		const pub1 = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Pub 1")
			.execute();

		const pub2 = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Pub 2")
			.connect(seededCommunity.pubFields["Some relation"].slug, pub1.id, "initial value")
			.execute();

		const updatedPub = await PubOp.upsert(pub2.id, {
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.connect(seededCommunity.pubFields["Some relation"].slug, pub1.id, "updated value")
			.execute();

		expect(updatedPub).toHaveValues([
			{ fieldSlug: seededCommunity.pubFields["Title"].slug, value: "Pub 2" },
			{
				fieldSlug: seededCommunity.pubFields["Some relation"].slug,
				value: "updated value",
				relatedPubId: pub1.id,
			},
		]);
	});

	it("should be able to create a related pub with a different pubType then the toplevel pub", async () => {
		const pub1 = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Pub 1")
			.connect(
				seededCommunity.pubFields["Some relation"].slug,
				PubOp.create({
					communityId: seededCommunity.community.id,
					pubTypeId: seededCommunity.pubTypes["Minimal Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
				}).set(seededCommunity.pubFields["Title"].slug, "Pub 2"),
				"relation"
			)
			.execute();

		expect(pub1.pubTypeId).toBe(seededCommunity.pubTypes["Basic Pub"].id);
		expect(pub1).toHaveValues([
			{ fieldSlug: seededCommunity.pubFields["Title"].slug, value: "Pub 1" },
			{
				fieldSlug: seededCommunity.pubFields["Some relation"].slug,
				value: "relation",
				relatedPub: {
					pubTypeId: seededCommunity.pubTypes["Minimal Pub"].id,
					values: [
						{ fieldSlug: seededCommunity.pubFields["Title"].slug, value: "Pub 2" },
					],
				},
			},
		]);
	});
});

describe("relation management", () => {
	it("should disconnect a specific relation", async () => {
		// Create two pubs to relate
		const pub1 = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Pub 1")
			.execute();

		const pub2 = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Pub 2")
			.connect(seededCommunity.pubFields["Some relation"].slug, pub1.id, "initial value")
			.execute();

		// Disconnect the relation
		const updatedPub = await PubOp.update(pub2.id, {
			communityId: seededCommunity.community.id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.disconnect(seededCommunity.pubFields["Some relation"].slug, pub1.id)
			.execute();

		expect(updatedPub).toHaveValues([
			{ fieldSlug: seededCommunity.pubFields["Title"].slug, value: "Pub 2" },
		]);
	});

	it("should delete orphaned pubs when disconnecting relations", async () => {
		// Create a pub that will become orphaned
		const orphanedPub = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Soon to be orphaned")
			.execute();

		// Create a pub that relates to it
		const mainPub = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Main pub")
			.connect(
				seededCommunity.pubFields["Some relation"].slug,
				orphanedPub.id,
				"only relation"
			)
			.execute();

		// Disconnect with deleteOrphaned option
		await PubOp.update(mainPub.id, {
			communityId: seededCommunity.community.id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.disconnect(seededCommunity.pubFields["Some relation"].slug, orphanedPub.id, {
				deleteOrphaned: true,
			})
			.execute();

		await expect(orphanedPub.id).not.toExist();
	});

	it("should clear all relations for a specific field", async () => {
		// Create multiple related pubs
		const related1 = PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		}).set(seededCommunity.pubFields["Title"].slug, "Related 1");

		const related2 = PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		}).set(seededCommunity.pubFields["Title"].slug, "Related 2");

		// Create main pub with multiple relations
		const mainPub = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Main pub")
			.connect(seededCommunity.pubFields["Some relation"].slug, related1, "relation 1")
			.connect(seededCommunity.pubFields["Some relation"].slug, related2, "relation 2")
			.execute();

		// Clear all relations for the field
		const updatedPub = await PubOp.update(mainPub.id, {
			communityId: seededCommunity.community.id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.clearRelationsForField(seededCommunity.pubFields["Some relation"].slug)
			.execute();

		expect(updatedPub).toHaveValues([
			{ fieldSlug: seededCommunity.pubFields["Title"].slug, value: "Main pub" },
		]);
	});

	it("should override existing relations when using override option", async () => {
		// Create initial related pubs
		const related1 = PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		}).set(seededCommunity.pubFields["Title"].slug, "Related 1");

		const related2 = PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		}).set(seededCommunity.pubFields["Title"].slug, "Related 2");

		// Create main pub with initial relations
		const mainPub = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Main pub")
			.connect(seededCommunity.pubFields["Some relation"].slug, related1, "relation 1")
			.connect(seededCommunity.pubFields["Some relation"].slug, related2, "relation 2")
			.execute();

		const relatedPub1 = mainPub.values.find((v) => v.value === "relation 1")?.relatedPubId;
		const relatedPub2 = mainPub.values.find((v) => v.value === "relation 2")?.relatedPubId;
		expect(relatedPub1).toBeDefined();
		expect(relatedPub2).toBeDefined();
		await expect(relatedPub1).toExist();
		await expect(relatedPub2).toExist();

		const related3 = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Related 3")
			.execute();

		// Update with override - only related3 should remain
		const updatedPub = await PubOp.upsert(mainPub.id, {
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.connect(seededCommunity.pubFields["Some relation"].slug, related3.id, "new relation", {
				override: true,
			})
			.execute();

		expect(updatedPub).toHaveValues([
			{ fieldSlug: seededCommunity.pubFields["Title"].slug, value: "Main pub" },
			{
				fieldSlug: seededCommunity.pubFields["Some relation"].slug,
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
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Related 1")
			.execute();

		const related2 = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Related 2")
			.execute();

		// Create main pub and set multiple relations with override
		const mainPub = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Main pub")
			.connect(seededCommunity.pubFields["Some relation"].slug, related1.id, "relation 1", {
				override: true,
			})
			.execute();

		const updatedMainPub = await PubOp.update(mainPub.id, {
			communityId: seededCommunity.community.id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.connect(seededCommunity.pubFields["Some relation"].slug, related2.id, "relation 2", {
				override: true,
			})
			.connect(
				seededCommunity.pubFields["Some relation"].slug,
				PubOp.create({
					communityId: seededCommunity.community.id,
					pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
				}),
				"relation 3",
				{ override: true }
			)
			.execute();

		// Should have relation 2 and 3, but not 1
		expect(updatedMainPub).toHaveValues([
			{ fieldSlug: seededCommunity.pubFields["Title"].slug, value: "Main pub" },
			{
				fieldSlug: seededCommunity.pubFields["Some relation"].slug,
				value: "relation 2",
				relatedPubId: related2.id,
			},
			{
				fieldSlug: seededCommunity.pubFields["Some relation"].slug,
				value: "relation 3",
				relatedPubId: expect.any(String),
			},
		]);
	});

	it("should handle complex nested relation scenarios", async () => {
		const trx = getTrx();
		// manual rollback try/catch bc we are manually setting pubIds, so a failure in the middle of this will leave the db in a weird state
		try {
			// Create all pubs with meaningful IDs
			const pubA = "aaaaaaaa-0000-0000-0000-000000000000" as PubsId;
			const pubB = "bbbbbbbb-0000-0000-0000-000000000000" as PubsId;
			const pubC = "cccccccc-0000-0000-0000-000000000000" as PubsId;
			const pubD = "dddddddd-0000-0000-0000-000000000000" as PubsId;
			const pubE = "eeeeeeee-0000-0000-0000-000000000000" as PubsId;
			const pubF = "ffffffff-0000-0000-0000-000000000000" as PubsId;
			const pubG = "11111111-0000-0000-0000-000000000000" as PubsId;
			const pubH = "22222222-0000-0000-0000-000000000000" as PubsId;
			const pubI = "33333333-0000-0000-0000-000000000000" as PubsId;
			const pubJ = "44444444-0000-0000-0000-000000000000" as PubsId;
			const pubK = "55555555-0000-0000-0000-000000000000" as PubsId;
			const pubL = "66666666-0000-0000-0000-000000000000" as PubsId;

			// Create the graph structure:
			//          A          J
			//       /     \       |
			//     /        \      |
			//   B           C --> I
			//   |         /  \
			//   G -->  E      D
			//               /  \
			//             F     H
			//                 /  \
			//                K --> L

			// Create leaf nodes first
			const pubL_op = PubOp.createWithId(pubL, {
				communityId: seededCommunity.community.id,
				pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
				lastModifiedBy: createLastModifiedBy("system"),
				trx,
			}).set(seededCommunity.pubFields["Title"].slug, "L");

			const pubK_op = PubOp.createWithId(pubK, {
				communityId: seededCommunity.community.id,
				pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
				lastModifiedBy: createLastModifiedBy("system"),
				trx,
			})
				.set(seededCommunity.pubFields["Title"].slug, "K")
				.connect(seededCommunity.pubFields["Some relation"].slug, pubL_op, "to L");

			const pubF_op = PubOp.createWithId(pubF, {
				communityId: seededCommunity.community.id,
				pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
				lastModifiedBy: createLastModifiedBy("system"),
				trx,
			}).set(seededCommunity.pubFields["Title"].slug, "F");

			const pubH_op = PubOp.createWithId(pubH, {
				communityId: seededCommunity.community.id,
				pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
				lastModifiedBy: createLastModifiedBy("system"),
				trx,
			})
				.set(seededCommunity.pubFields["Title"].slug, "H")
				.connect(seededCommunity.pubFields["Some relation"].slug, pubK_op, "to K")
				.connect(seededCommunity.pubFields["Some relation"].slug, pubL_op, "to L");

			const pubE_op = PubOp.createWithId(pubE, {
				communityId: seededCommunity.community.id,
				pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
				lastModifiedBy: createLastModifiedBy("system"),
				trx,
			})
				.set(seededCommunity.pubFields["Title"].slug, "E")
				.connect(seededCommunity.pubFields["Some relation"].slug, pubF_op, "to F");

			const pubG_op = PubOp.createWithId(pubG, {
				communityId: seededCommunity.community.id,
				pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
				lastModifiedBy: createLastModifiedBy("system"),
				trx,
			})
				.set(seededCommunity.pubFields["Title"].slug, "G")
				.connect(seededCommunity.pubFields["Some relation"].slug, pubE_op, "to E");

			const pubD_op = PubOp.createWithId(pubD, {
				communityId: seededCommunity.community.id,
				pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
				lastModifiedBy: createLastModifiedBy("system"),
				trx,
			})
				.set(seededCommunity.pubFields["Title"].slug, "D")
				.connect(seededCommunity.pubFields["Some relation"].slug, pubH_op, "to H");

			const pubI_op = PubOp.createWithId(pubI, {
				communityId: seededCommunity.community.id,
				pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
				lastModifiedBy: createLastModifiedBy("system"),
				trx,
			}).set(seededCommunity.pubFields["Title"].slug, "I");

			// Create second layer
			const pubB_op = PubOp.createWithId(pubB, {
				communityId: seededCommunity.community.id,
				pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
				lastModifiedBy: createLastModifiedBy("system"),
				trx,
			})
				.set(seededCommunity.pubFields["Title"].slug, "B")
				.connect(seededCommunity.pubFields["Some relation"].slug, pubG_op, "to G");

			const pubC_op = PubOp.createWithId(pubC, {
				communityId: seededCommunity.community.id,
				pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
				lastModifiedBy: createLastModifiedBy("system"),
				trx,
			})
				.set(seededCommunity.pubFields["Title"].slug, "C")
				.connect(seededCommunity.pubFields["Some relation"].slug, pubI_op, "to I")
				.connect(seededCommunity.pubFields["Some relation"].slug, pubD_op, "to D")
				.connect(seededCommunity.pubFields["Some relation"].slug, pubE_op, "to E");

			// Create root
			const rootPub = await PubOp.createWithId(pubA, {
				communityId: seededCommunity.community.id,
				pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
				lastModifiedBy: createLastModifiedBy("system"),
				trx,
			})
				.set(seededCommunity.pubFields["Title"].slug, "A")
				.connect(seededCommunity.pubFields["Some relation"].slug, pubB_op, "to B")
				.connect(seededCommunity.pubFields["Some relation"].slug, pubC_op, "to C")
				.execute();

			const pubJ_op = await PubOp.createWithId(pubJ, {
				communityId: seededCommunity.community.id,
				pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
				lastModifiedBy: createLastModifiedBy("system"),
				trx,
			})
				.set(seededCommunity.pubFields["Title"].slug, "J")
				.connect(seededCommunity.pubFields["Some relation"].slug, pubI, "to I")
				.execute();

			const { getPubsWithRelatedValuesAndChildren } = await import("~/lib/server/pub");

			// verify the initial state
			const initialState = await getPubsWithRelatedValuesAndChildren(
				{
					pubId: pubA,
					communityId: seededCommunity.community.id,
				},
				{ trx, depth: 10 }
			);

			expect(initialState.values).toMatchObject([
				{ value: "A" },
				{
					value: "to B",
					relatedPubId: pubB,
					relatedPub: {
						values: [
							{ value: "B" },
							{
								value: "to G",
								relatedPubId: pubG,
								relatedPub: {
									values: [
										{ value: "G" },
										{
											value: "to E",
											relatedPubId: pubE,
											relatedPub: {
												values: [
													{ value: "E" },
													{
														value: "to F",
														relatedPubId: pubF,
														relatedPub: {
															values: [{ value: "F" }],
														},
													},
												],
											},
										},
									],
								},
							},
						],
					},
				},
				{
					value: "to C",
					relatedPubId: pubC,
					relatedPub: {
						values: [
							{ value: "C" },
							{
								value: "to I",
								relatedPubId: pubI,
								relatedPub: {
									values: [{ value: "I" }],
								},
							},
							{
								value: "to D",
								relatedPubId: pubD,
								relatedPub: {
									values: [
										{ value: "D" },
										{
											value: "to H",
											relatedPubId: pubH,
											relatedPub: {
												values: [
													{ value: "H" },
													{
														value: "to K",
														relatedPubId: pubK,
														relatedPub: {
															values: [
																{ value: "K" },
																{
																	value: "to L",
																	relatedPubId: pubL,
																	relatedPub: {
																		values: [{ value: "L" }],
																	},
																},
															],
														},
													},
													{
														value: "to L",
													},
												],
											},
										},
									],
								},
							},
							{
								value: "to E",
								relatedPubId: pubE,
							},
						],
					},
				},
			]);

			// Now disconnect C from A, which should
			//  orphan everything from D down,
			// but should not orphan I, bc J still points to it
			// and should not orphan G, bc B still points to it
			// it orphans L, even though K points to it, because K is itself an orphan
			//        A             J
			//      /              |
			//    v        X       v
			//   B           C --> I
			//   |         /  \
			//   v        v    v
			//   G -->  E      D
			//               /  \
			//              v    v
			//             F     H
			//                 /  \
			//                v    v
			//                K --> L
			await PubOp.update(pubA, {
				communityId: seededCommunity.community.id,
				lastModifiedBy: createLastModifiedBy("system"),
				trx,
			})
				.disconnect(seededCommunity.pubFields["Some relation"].slug, pubC, {
					deleteOrphaned: true,
				})
				.execute();

			// Verify deletions
			await expect(pubA, "A should exist").toExist(trx);
			await expect(pubB, "B should exist").toExist(trx);
			await expect(pubC, "C should not exist").not.toExist(trx);
			await expect(pubD, "D should not exist").not.toExist(trx);
			await expect(pubE, "E should exist").toExist(trx); // Still connected through G
			await expect(pubF, "F should exist").toExist(trx);
			await expect(pubG, "G should exist").toExist(trx);
			await expect(pubH, "H should not exist").not.toExist(trx);
			await expect(pubI, "I should exist").toExist(trx); // Still connected through J
			await expect(pubJ, "J should exist").toExist(trx);
			await expect(pubK, "K should not exist").not.toExist(trx);
			await expect(pubL, "L should not exist").not.toExist(trx);
		} catch (e) {
			rollback();
			throw e;
		}
	});

	it("should handle selective orphan deletion based on field", async () => {
		// Create a pub with two relations
		const related1 = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Related 1")
			.execute();

		const related2 = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Related 2")
			.execute();

		const mainPub = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Main")
			.connect(seededCommunity.pubFields["Some relation"].slug, related1.id, "relation1")
			.connect(seededCommunity.pubFields["Another relation"].slug, related2.id, "relation2")
			.execute();

		// Clear one field with deleteOrphaned and one without
		await PubOp.update(mainPub.id, {
			communityId: seededCommunity.community.id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.clearRelationsForField(seededCommunity.pubFields["Some relation"].slug, {
				deleteOrphaned: true,
			})
			.clearRelationsForField(seededCommunity.pubFields["Another relation"].slug)
			.execute();

		// Related1 should be deleted (orphaned with deleteOrphaned: true)
		await expect(related1.id).not.toExist();
		// Related2 should still exist (orphaned but deleteOrphaned not set)
		await expect(related2.id).toExist();
	});

	it("should handle override with mixed deleteOrphaned flags", async () => {
		// Create initial relations
		const toKeep = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Keep Me")
			.execute();

		const toDelete = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Delete Me")
			.execute();

		const mainPub = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.set(seededCommunity.pubFields["Title"].slug, "Main")
			.connect(seededCommunity.pubFields["Some relation"].slug, toKeep.id, "keep")
			.connect(seededCommunity.pubFields["Another relation"].slug, toDelete.id, "delete")
			.execute();

		// Override relations with different deleteOrphaned flags
		const newRelation = PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
		}).set(seededCommunity.pubFields["Title"].slug, "New");

		await PubOp.update(mainPub.id, {
			communityId: seededCommunity.community.id,
			lastModifiedBy: createLastModifiedBy("system"),
		})
			.connect(seededCommunity.pubFields["Some relation"].slug, newRelation, "new", {
				override: true,
			})
			.connect(seededCommunity.pubFields["Another relation"].slug, newRelation, "also new", {
				override: true,
				deleteOrphaned: true,
			})
			.execute();

		// toKeep should still exist (override without deleteOrphaned)
		await expect(toKeep.id).toExist();
		// toDelete should be deleted (override with deleteOrphaned)
		await expect(toDelete.id).not.toExist();
	});
});

describe("PubOp stage", () => {
	it("should be able to set a stage while creating a pub", async () => {
		const trx = getTrx();
		const pub = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		})
			.set(seededCommunity.pubFields["Title"].slug, "Test")
			.setStage(seededCommunity.stages["Stage 1"].id)
			.execute();

		expect(pub.stageId).toEqual(seededCommunity.stages["Stage 1"].id);
	});

	it("should be able to unset a stage", async () => {
		const trx = getTrx();
		const pub = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		})
			.setStage(seededCommunity.stages["Stage 1"].id)
			.execute();

		expect(pub.stageId).toEqual(seededCommunity.stages["Stage 1"].id);

		const updatedPub = await PubOp.update(pub.id, {
			communityId: seededCommunity.community.id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		})
			.setStage(null)
			.execute();

		expect(updatedPub.stageId).toEqual(null);
	});

	it("should be able to move a pub to different stage", async () => {
		const trx = getTrx();
		const pub = await PubOp.create({
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		})
			.set(seededCommunity.pubFields["Title"].slug, "Test")
			.setStage(seededCommunity.stages["Stage 1"].id)
			.execute();

		const updatedPub = await PubOp.upsert(pub.id, {
			communityId: seededCommunity.community.id,
			pubTypeId: seededCommunity.pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		})
			.setStage(seededCommunity.stages["Stage 2"].id)
			.execute();

		const stages = await trx
			.selectFrom("PubsInStages")
			.selectAll()
			.where("pubId", "=", pub.id)
			.execute();
		console.log(stages);

		// expect(stages).toEqual([{ pubId: pub.id, stageId: seededCommunity.stages["Stage 2"].id }]);
	});
});
