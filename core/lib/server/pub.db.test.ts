import { sql } from "kysely";
import { beforeAll, describe, expect, it } from "vitest";

import type { PubWithChildren } from "contracts";
import type { Communities, PubTypes } from "db/public";
import { CoreSchemaType } from "db/public";

import type { AutoReturnType } from "../types";
import type { getPubTypesForCommunity } from "./pubtype";
import type { getCommunityStages } from "./stages";
import { mockServerCode } from "~/lib/__tests__/utils";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

// TODO: replace with community seed
let community: Communities;
let pubTypes: Awaited<ReturnType<typeof getPubTypesForCommunity>>;
let submissionPubType: (typeof pubTypes)[number];
let someStringField: (typeof submissionPubType.fields)[number];
let someRelationField: (typeof submissionPubType.fields)[number];
let pubs: PubWithChildren[];
let stages: AutoReturnType<typeof getCommunityStages>["execute"];

beforeAll(async () => {
	const { getPubTypesForCommunity } = await import("./pubtype");
	const { findCommunityBySlug } = await import("./community");
	const { getPubs } = await import("./pub");
	const { getCommunityStages } = await import("./stages");

	community = (await findCommunityBySlug("croccroc"))!;
	community = (await findCommunityBySlug("croccroc"))!;
	pubTypes = await getPubTypesForCommunity(community.id);
	submissionPubType = pubTypes.find((pt) => pt.name === "Submission")!;
	someStringField = submissionPubType.fields.find(
		(f) => f.schemaName === CoreSchemaType.String && !f.isRelation
	)!;
	someRelationField = submissionPubType.fields.find(
		(f) => f.schemaName === CoreSchemaType.String && f.isRelation
	)!;

	pubs = await getPubs({ communityId: community.id });
	stages = await getCommunityStages(community.id).execute();
});

// beforeAll(async () => {
// });

describe("createPubRecursive", () => {
	it("should be able to create a simple pub", async () => {
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes[0].id,
				values: {
					[someStringField.slug]: "test",
				},
			},
		});

		expect(pub).toMatchObject({
			values: [
				{
					value: "test",
				},
			],
		});
	});

	it("should be able to create a pub with children", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: submissionPubType.id,
				values: {
					[someStringField.slug]: "test title",
				},
				children: [
					{
						pubTypeId: submissionPubType.id,
						values: {
							[someStringField.slug]: "test child title",
						},
					},
				],
			},
			trx,
		});

		expect(pub).toMatchObject({
			values: [{ value: "test title" }],
			children: [{ values: [{ value: "test child title" }] }],
		});
	});

	it("should be able to create a pub in a stage", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: submissionPubType.id,
				values: {
					[someStringField.slug]: "test title",
				},
				stageId: stages[0].id,
			},
			trx,
		});

		expect(pub).toMatchObject({
			stageId: stages[0].id,
			values: [{ value: "test title" }],
		});
	});

	it("should be able to create a relation pub value with direct linking", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: submissionPubType.id,
				values: {
					[someStringField.slug]: "test title",
					[someRelationField.slug]: {
						value: "test relation value",
						relatedPubId: pubs[0].id,
					},
				},
			},
			trx,
		});

		expect(pub).toMatchObject({
			values: [
				{ value: "test title" },
				{ value: "test relation value", relatedPubId: pubs[0].id },
			],
		});
	});

	it("should be able to create relation pubs inline, like children", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: submissionPubType.id,
				values: {
					[someStringField.slug]: "test title",
				},
				relatedPubs: {
					[someRelationField.slug]: [
						{
							value: "test relation value",
							pub: {
								pubTypeId: submissionPubType.id,
								values: {
									[someStringField.slug]: "test relation title",
								},
							},
						},
					],
				},
			},
			trx,
		});

		expect(pub).toMatchObject({
			values: [{ value: "test title" }],
			relatedPubs: [
				{
					value: "test relation value",
					relatedPub: { values: [{ value: "test relation title" }] },
				},
			],
		});
	});
});

describe("getPubsWithRelatedValuesAndChildren", () => {
	it("should be able to recursively fetch pubvalues", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: submissionPubType.id,
				values: {
					[someStringField.slug]: "Some title",
				},
				relatedPubs: {
					[someRelationField.slug]: [
						{
							value: "test relation value",
							pub: {
								pubTypeId: submissionPubType.id,
								values: {
									[someStringField.slug]: "test relation title",
								},
							},
						},
					],
				},
			},
			trx,
		});

		const { getPubWithRelatedValuesAndChildren } = await import("./pub");
		const rootPubId = pub.id;
		const pubValues = await getPubWithRelatedValuesAndChildren(rootPubId, 10);

		expect(pubValues).toMatchObject({
			values: [
				{ value: "Some title" },
				{
					value: "test relation value",
					relatedPub: {
						values: [{ value: "test relation title" }],
					},
				},
			],
		});
	});

	it("should be able to fetch pubvalues with children", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: submissionPubType.id,
				values: {
					[someStringField.slug]: "Some title",
				},
				relatedPubs: {
					[someRelationField.slug]: [
						{
							value: "test relation value",
							pub: {
								pubTypeId: submissionPubType.id,
								values: {
									[someStringField.slug]: "Nested Related Pub",
								},
								children: [
									{
										pubTypeId: submissionPubType.id,
										values: {
											[someStringField.slug]:
												"Nested Child of Nested Related Pub",
										},
									},
								],
							},
						},
					],
				},
				children: [
					{
						pubTypeId: submissionPubType.id,
						values: {
							[someStringField.slug]: "Child of Root Pub",
						},
						relatedPubs: {
							[someRelationField.slug]: [
								{
									value: "Nested Relation",
									pub: {
										pubTypeId: submissionPubType.id,
										values: {
											[someStringField.slug]:
												"Nested Related Pub of Child of Root Pub",
										},
										relatedPubs: {
											[someRelationField.slug]: [
												{
													value: "Double nested relation",
													pub: {
														pubTypeId: submissionPubType.id,
														values: {
															[someStringField.slug]:
																"Double nested relation title",
														},
													},
												},
											],
										},
									},
								},
								{
									value: "Nested Relation 2",
									pub: {
										pubTypeId: submissionPubType.id,
										values: {
											[someStringField.slug]:
												"Nested Related Pub of Child of Root Pub 2",
										},
									},
								},
							],
						},
						children: [
							{
								pubTypeId: submissionPubType.id,
								values: {
									[someStringField.slug]: "Grandchild of Root Pub",
								},
							},
						],
					},
				],
			},
			trx,
		});

		const rootPubId = pub.id;
		const { getPubWithRelatedValuesAndChildren } = await import("./pub");
		const pubWithRelatedValuesAndChildren = await getPubWithRelatedValuesAndChildren(
			rootPubId,
			10
		);

		expect(pubWithRelatedValuesAndChildren).toMatchObject({
			values: [
				{ value: "Some title" },
				{
					value: "test relation value",
					relatedPub: {
						values: [{ value: "Nested Related Pub" }],
						children: [{ values: [{ value: "Nested Child of Nested Related Pub" }] }],
					},
				},
			],
			children: [
				{
					values: [
						{ value: "Child of Root Pub" },
						{
							value: "Nested Relation 2",
						},
						{
							value: "Nested Relation",
							relatedPub: {
								values: [
									{
										value: "Nested Related Pub of Child of Root Pub",
									},
									{
										value: "Double nested relation",
										relatedPub: {
											values: [{ value: "Double nested relation title" }],
										},
									},
								],
							},
						},
					],
					children: [{ values: [{ value: "Grandchild of Root Pub" }] }],
				},
			],
		});
	});
});
