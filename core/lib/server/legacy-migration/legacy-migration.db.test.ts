import { beforeAll, describe, expect, it } from "vitest";

import {
	Capabilities,
	CoreSchemaType,
	ElementType,
	InputComponent,
	MemberRole,
	MembershipType,
} from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
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
	],
});

let community: CommunitySeedOutput<typeof seed>;

beforeAll(async () => {
	const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
	community = await seedCommunity(seed);
});

describe("getPubByForm", () => {
	const getAllImports = async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { getPubByForm } = await import("~/lib/pubs");
		const { getPubsWithRelatedValues } = await import("~/lib/server/pub");
		const { getForm } = await import("~/lib/server/form");

		return { seedCommunity, getPubByForm, getPubsWithRelatedValues, getForm };
	};

	it("should be able to create everything", async () => {
		const trx = getTrx();

		const { createCorrectPubFields, createCorrectPubTypes } = await import(
			"~/lib/server/legacy-migration/legacy-migration"
		);
		const { getPubFields } = await import("../pubFields");

		const { createLegacyStructure, REQUIRED_LEGACY_PUB_FIELDS } = await import(
			"~/lib/server/legacy-migration/legacy-migration"
		);

		const result = await createLegacyStructure({
			community: community.community,
		});

		const { fields } = await getPubFields({
			communityId: community.community.id,
		}).executeTakeFirstOrThrow();
		// console.log(fields);
		expect(Object.keys(fields)).toHaveLength(
			// bc Title and Description already exist, but "some relation" does not
			Object.keys(REQUIRED_LEGACY_PUB_FIELDS).length + 1
		);
	});
});
