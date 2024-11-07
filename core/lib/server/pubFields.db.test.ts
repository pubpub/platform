import { beforeAll, describe, expect, it } from "vitest";

import { CoreSchemaType } from "db/public";

import { mockServerCode } from "~/lib/__tests__/utils";
import { seedCommunity } from "~/prisma/seed/seedCommunity";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

const { community, pubTypes, stages, pubs } = await seedCommunity({
	community: {
		name: "pubfields test",
		slug: "pubfields-test",
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Date: { schemaName: CoreSchemaType.DateTime },
		"Some relation": { schemaName: CoreSchemaType.String, relation: true },
	},
	pubTypes: {
		"Basic Pub": {
			Title: { isTitle: true },
			Date: { isTitle: false },
			"Some relation": { isTitle: false },
		},
	},
	pubs: [
		{
			pubType: "Basic Pub",
			values: {
				Title: "Some title",
			},
		},
	],
	stages: {
		"Stage 1": {},
	},
	users: {},
});
