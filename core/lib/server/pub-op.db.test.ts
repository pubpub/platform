import { describe, expect, expectTypeOf, it, vitest } from "vitest";

import type { PubsId, PubTypes, Stages } from "db/public";
import { CoreSchemaType, MemberRole } from "db/public";

import { mockServerCode } from "~/lib/__tests__/utils";
import { createLastModifiedBy } from "../lastModifiedBy";
import { PubOp } from "./pub-op";

const { createSeed, seedCommunity } = await import("~/prisma/seed/seedCommunity");

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

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
		const trx = getTrx();
		const id = crypto.randomUUID() as PubsId;
		const pubOp = PubOp.upsert(id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		const pub = await pubOp.execute();
		await expect(pub.id).toExist(trx);
	});

	it("should not fail when upserting existing pub", async () => {
		const trx = getTrx();
		const id = crypto.randomUUID() as PubsId;
		const pubOp = PubOp.upsert(id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		const pub = await pubOp.execute();
		await expect(pub.id).toExist(trx);

		const pub2 = await PubOp.upsert(id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		}).execute();

		await expect(pub2.id).toExist(trx);
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
		const trx = getTrx();
		const pubOp = PubOp.upsert(crypto.randomUUID() as PubsId, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		const pub = await pubOp.execute();
		await expect(pub.id).toExist(trx);

		const pub2 = await PubOp.upsert(crypto.randomUUID() as PubsId, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		})
			.relate(pubFields["Some relation"].slug, "test relations value", pubOp)
			.execute();

		await expect(pub2.id).toExist(trx);
		expect(pub2).toHaveValues([
			{
				fieldSlug: pubFields["Some relation"].slug,
				value: "test relations value",
				relatedPubId: pub.id,
			},
		]);
	});

	it("should create multiple related pubs in a single operation", async () => {
		const trx = getTrx();
		const mainPub = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		})
			.set(pubFields["Title"].slug, "Main Pub")
			.relate(
				pubFields["Some relation"].slug,
				"the first related pub",
				PubOp.create({
					communityId: community.id,
					pubTypeId: pubTypes["Basic Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
					trx,
				}).set(pubFields["Title"].slug, "Related Pub 1")
			)
			.relate(
				pubFields["Another relation"].slug,
				"the second related pub",
				PubOp.create({
					communityId: community.id,
					pubTypeId: pubTypes["Basic Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
					trx,
				}).set(pubFields["Title"].slug, "Related Pub 2")
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
		const trx = getTrx();
		const relatedPub = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		})
			.set(pubFields["Title"].slug, "Level 1")
			.relate(
				pubFields["Another relation"].slug,
				"the second related pub",
				PubOp.create({
					communityId: community.id,
					pubTypeId: pubTypes["Basic Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
					trx,
				}).set(pubFields["Title"].slug, "Level 2")
			);

		const mainPub = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		})
			.set(pubFields["Title"].slug, "Root")
			.relate(pubFields["Some relation"].slug, "the first related pub", relatedPub);

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
		const trx = getTrx();

		// First create a pub that we'll relate to
		const existingPub = await PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		})
			.set(pubFields["Title"].slug, "Existing Pub")
			.execute();

		const mainPub = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		})
			.set(pubFields["Title"].slug, "Main Pub")
			.relate(pubFields["Some relation"].slug, "the first related pub", existingPub.id)
			.relate(
				pubFields["Another relation"].slug,
				"the second related pub",
				PubOp.create({
					communityId: community.id,
					pubTypeId: pubTypes["Basic Pub"].id,
					lastModifiedBy: createLastModifiedBy("system"),
					trx,
				}).set(pubFields["Title"].slug, "New Related Pub")
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
		const trx = getTrx();

		const pub1 = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		}).set(pubFields["Title"].slug, "Pub 1");

		const pub2 = PubOp.create({
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		})
			.set(pubFields["Title"].slug, "Pub 2")
			.relate(pubFields["Some relation"].slug, "the first related pub", pub1);

		pub1.relate(pubFields["Another relation"].slug, "the second related pub", pub2);

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
		const trx = getTrx();
		const pubOp = PubOp.createWithId(pubs[0].id, {
			communityId: community.id,
			pubTypeId: pubTypes["Basic Pub"].id,
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		await expect(pubOp.execute()).rejects.toThrow(
			/Cannot create a pub with an id that already exists/
		);
	});
});
