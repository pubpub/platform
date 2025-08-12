import { describe, expect, it } from "vitest";

import {
	Capabilities,
	CoreSchemaType,
	ElementType,
	InputComponent,
	MemberRole,
	MembershipType,
} from "db/public";

import { mockServerCode } from "~/lib/__tests__/utils";
import { createSeed } from "~/prisma/seed/createSeed";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

const seed = createSeed({
	community: {
		name: "test",
		slug: "test-form-view",
	},
	users: {
		admin: {
			role: MemberRole.admin,
		},
		editor: {
			role: MemberRole.editor,
		},
		contributor: {
			role: MemberRole.contributor,
		},
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Description: { schemaName: CoreSchemaType.String },
		"Some relation": { schemaName: CoreSchemaType.String, relation: true },
	},
	pubTypes: {
		"Basic Pub": {
			Title: { isTitle: true },
			"Some relation": { isTitle: false },
		},
	},
	pubs: [
		{
			pubType: "Basic Pub",
			values: {
				Title: "Some title",
				Description: "Some description",
			},
			members: { admin: MemberRole.admin },
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
					{
						value: "second relation value",
						pub: {
							pubType: "Basic Pub",
							values: {
								Title: "Another pub related to another Pub",
							},
						},
					},
				],
			},
		},
	],
	forms: {
		"basic-pub-form": {
			pubType: "Basic Pub",
			elements: [
				{
					type: ElementType.pubfield,
					field: "Description",
					component: InputComponent.textInput,
					config: {
						label: "Description",
					},
				},
				{
					type: ElementType.pubfield,
					field: "Title",
					component: InputComponent.textInput,
					config: {
						label: "Title",
					},
				},
			],
		},
		"second-form": {
			pubType: "Basic Pub",
			elements: [
				{
					type: ElementType.pubfield,
					field: "Title",
					component: InputComponent.textInput,
					config: {
						label: "Title",
					},
				},
				{
					type: ElementType.pubfield,
					field: "Some relation",
					component: InputComponent.textInput,
					relatedPubTypes: ["Basic Pub"],
					config: {
						relationshipConfig: {
							label: "Related",
							help: "Help",
							component: InputComponent.relationBlock,
						},
					},
				},
			],
		},
	},
});

describe("getPubByForm", () => {
	const getAllImports = async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { getPubByForm } = await import("./pubs");
		const { getPubsWithRelatedValues } = await import("./server/pub");
		const { getForm } = await import("./server/form");

		return { seedCommunity, getPubByForm, getPubsWithRelatedValues, getForm };
	};

	it("should be able to get a pub with form elements", async () => {
		const { seedCommunity, getPubByForm, getPubsWithRelatedValues, getForm } =
			await getAllImports();
		const { pubs, community } = await seedCommunity(seed);

		const [pub, form] = await Promise.all([
			getPubsWithRelatedValues(
				{ pubId: pubs[0].id, communityId: community.id },
				{
					withRelatedPubs: true,
					withMembers: true,
					withPubType: true,
					withStage: true,
					withStageActionInstances: true,
				}
			),
			// Get the default form for this pub
			getForm({
				pubTypeId: pubs[0].pubTypeId,
				communityId: community.id,
			}).executeTakeFirstOrThrow(),
		]);

		const pubWithForm = getPubByForm({ pub, form, withExtraPubValues: true });

		expect(pubWithForm).toMatchObject({
			values: [
				// Pub value and form element
				{
					value: "Some title",
					formElementConfig: { label: "Title" },
				},
				// Only form element
				{
					id: null,
					value: null,
					formElementConfig: {
						relationshipConfig: { label: "Some relation", component: "relationBlock" },
					},
				},
				// Only pub value
				{
					value: "Some description",
				},
			],
		});
		// Check that the element without a form does not have any form related values
		expect(pubWithForm.values[2]).not.toHaveProperty("formElementId");
	});

	it("should filter out pub values if needed", async () => {
		const { seedCommunity, getPubByForm, getPubsWithRelatedValues, getForm } =
			await getAllImports();
		const { pubs, community } = await seedCommunity(seed);

		const [pub, form] = await Promise.all([
			getPubsWithRelatedValues(
				{ pubId: pubs[0].id, communityId: community.id },
				{
					withRelatedPubs: true,
					withMembers: true,
					withPubType: true,
					withStage: true,
					withStageActionInstances: true,
				}
			),
			// Get the default form for this pub
			getForm({
				pubTypeId: pubs[0].pubTypeId,
				communityId: community.id,
			}).executeTakeFirstOrThrow(),
		]);

		const pubWithForm = getPubByForm({ pub, form, withExtraPubValues: false });
		expect(pubWithForm).toMatchObject({
			values: [
				// Pub value and form element
				{
					value: "Some title",
					formElementConfig: { label: "Title" },
				},
				// Only form element
				{
					id: null,
					value: null,
					formElementConfig: {
						relationshipConfig: { label: "Some relation", component: "relationBlock" },
					},
				},
			],
		});
	});

	it("should filter out pub values by user permissions", async () => {
		const { seedCommunity, getPubByForm, getPubsWithRelatedValues, getForm } =
			await getAllImports();
		const { pubs, community, users } = await seedCommunity(seed);
		const { userCan } = await import("./authorization/capabilities");

		const [pub, form, adminCan, editorCan, contributorCan] = await Promise.all([
			getPubsWithRelatedValues(
				{ pubId: pubs[0].id, communityId: community.id },
				{
					withRelatedPubs: true,
					withMembers: true,
					withPubType: true,
					withStage: true,
					withStageActionInstances: true,
				}
			),
			// Get the default form for this pub
			getForm({
				pubTypeId: pubs[0].pubTypeId,
				communityId: community.id,
			}).executeTakeFirstOrThrow(),
			userCan(
				Capabilities.seeExtraPubValues,
				{ type: MembershipType.community, communityId: community.id },
				users.admin.id
			),
			userCan(
				Capabilities.seeExtraPubValues,
				{ type: MembershipType.community, communityId: community.id },
				users.editor.id
			),
			userCan(
				Capabilities.seeExtraPubValues,
				{ type: MembershipType.community, communityId: community.id },
				users.contributor.id
			),
		]);

		[
			{ withExtraPubValues: adminCan, expected: 3 },
			{ withExtraPubValues: editorCan, expected: 3 },
			{ withExtraPubValues: contributorCan, expected: 2 },
		].forEach(({ withExtraPubValues, expected }) => {
			const pubWithForm = getPubByForm({ pub, form, withExtraPubValues });
			expect(pubWithForm.values).toHaveLength(expected);
		});
	});

	it("should respect form order", async () => {
		const { seedCommunity, getPubByForm, getPubsWithRelatedValues, getForm } =
			await getAllImports();
		const { pubs, community, forms } = await seedCommunity(seed);

		const [pub, form] = await Promise.all([
			getPubsWithRelatedValues(
				{ pubId: pubs[0].id, communityId: community.id },
				{
					withRelatedPubs: true,
					withMembers: true,
					withPubType: true,
					withStage: true,
					withStageActionInstances: true,
				}
			),
			// Get a form we made in the seed which puts description before title
			getForm({
				id: forms["basic-pub-form"].id,
				communityId: community.id,
			}).executeTakeFirstOrThrow(),
		]);

		const pubWithForm = getPubByForm({ pub, form, withExtraPubValues: true });

		expect(pubWithForm).toMatchObject({
			values: [
				{
					value: "Some description",
					formElementConfig: { label: "Description" },
				},
				{
					value: "Some title",
					formElementConfig: { label: "Title" },
				},
			],
		});
	});

	it("should keep extra pub values ordered", async () => {
		const seed2 = createSeed({
			community: {
				name: "test2",
				slug: "test-ordered-pub-values",
			},
			users: {
				admin: {
					role: MemberRole.admin,
				},
			},
			pubFields: {
				Title: { schemaName: CoreSchemaType.String },
				Description: { schemaName: CoreSchemaType.String },
				"First name": { schemaName: CoreSchemaType.String },
				"Middle name": { schemaName: CoreSchemaType.String },
				"Last name": { schemaName: CoreSchemaType.String },
				Suffix: { schemaName: CoreSchemaType.String },
			},
			pubTypes: {
				"Basic Pub": {
					Title: { isTitle: true },
				},
			},
			pubs: [
				{
					pubType: "Basic Pub",
					values: {
						Title: "Some title",
						Description: "Some description",
						"First name": "First",
						"Middle name": "Middle",
						"Last name": "Last",
						Suffix: "Junior",
					},
					members: { admin: MemberRole.admin },
				},
			],
			forms: {
				"basic-pub-form": {
					pubType: "Basic Pub",
					elements: [
						{
							type: ElementType.pubfield,
							field: "Title",
							component: InputComponent.textInput,
							config: {
								label: "Title",
							},
						},
					],
				},
			},
		});
		const { seedCommunity, getPubByForm, getPubsWithRelatedValues, getForm } =
			await getAllImports();
		const { pubs, community, forms } = await seedCommunity(seed2);

		const pubId = pubs[0].id;

		const [pub, form] = await Promise.all([
			getPubsWithRelatedValues(
				{ pubId, communityId: community.id },
				{
					withRelatedPubs: true,
					withMembers: true,
					withPubType: true,
					withStage: true,
					withStageActionInstances: true,
				}
			),
			getForm({
				id: forms["basic-pub-form"].id,
				communityId: community.id,
			}).executeTakeFirstOrThrow(),
		]);

		const pubWithForm = getPubByForm({ pub, form, withExtraPubValues: true });

		// The extra pub values should be in the same order as the original `pub`
		const justTheValues = pubWithForm.values.map((v) => v.value);
		const pubValues = pub.values.filter((v) => v.fieldName !== "Title").map((v) => v.value);
		const expectedValues = ["Some title", ...pubValues];

		expect(justTheValues).toEqual(expectedValues);
	});

	it("should handle multiple relations with a form", async () => {
		const { seedCommunity, getPubByForm, getPubsWithRelatedValues, getForm } =
			await getAllImports();
		const { pubs, community, forms } = await seedCommunity(seed);
		// This pub has relation fields
		const pubId = pubs[1].id;
		const communityId = community.id;

		const [pub, form] = await Promise.all([
			getPubsWithRelatedValues(
				{ pubId, communityId },
				{
					withRelatedPubs: true,
					withMembers: true,
					withPubType: true,
					withStage: true,
					withStageActionInstances: true,
				}
			),
			// Get the second form which has a relation field
			getForm({
				id: forms["second-form"].id,
				communityId,
			}).executeTakeFirstOrThrow(),
		]);

		const pubWithForm = getPubByForm({ pub, form, withExtraPubValues: true });

		expect(pubWithForm).toMatchObject({
			values: [
				{
					value: "Another title",
					formElementConfig: { label: "Title" },
				},
				{
					value: "test relation value",
					formElementConfig: {
						relationshipConfig: {
							label: "Related",
							help: "Help",
							component: InputComponent.relationBlock,
						},
					},
				},
				{
					value: "second relation value",
					formElementConfig: {
						relationshipConfig: {
							label: "Related",
							help: "Help",
							component: InputComponent.relationBlock,
						},
					},
				},
			],
		});
	});

	it("should handle multiple relations without a form element", async () => {
		const { seedCommunity, getPubByForm, getPubsWithRelatedValues, getForm } =
			await getAllImports();
		const { pubs, community, forms } = await seedCommunity(seed);
		// This pub has relation fields
		const pubId = pubs[1].id;
		const communityId = community.id;

		const [pub, form] = await Promise.all([
			getPubsWithRelatedValues(
				{ pubId, communityId },
				{
					withRelatedPubs: true,
					withMembers: true,
					withPubType: true,
					withStage: true,
					withStageActionInstances: true,
				}
			),
			// Get the first form which does not have a relation field
			getForm({
				id: forms["basic-pub-form"].id,
				communityId,
			}).executeTakeFirstOrThrow(),
		]);
		const pubWithForm = getPubByForm({ pub, form, withExtraPubValues: true });
		expect(pubWithForm).toMatchObject({
			values: [
				{
					value: null,
					formElementConfig: { label: "Description" },
				},
				{
					value: "Another title",
					formElementConfig: { label: "Title" },
				},
				{
					value: "test relation value",
				},
				{
					value: "second relation value",
				},
			],
		});
		// Check that the element without a form does not have any form related values
		expect(pubWithForm.values[2]).not.toHaveProperty("formElementId");
		expect(pubWithForm.values[3]).not.toHaveProperty("formElementId");
	});
});
