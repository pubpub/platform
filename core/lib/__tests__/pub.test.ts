import { describe, expect, test } from "vitest";

import type { PubsId } from "db/public";
import { CoreSchemaType } from "db/public";

import { mockServerCode } from "~/lib/__tests__/utils";
import { getPubs } from "../server";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx, rollback, commit } = createForEachMockedTransaction();

test("Should be able to create some sort of community", async () => {
	const trx = getTrx();

	const seedCommunity = await import("~/prisma/seed/seedCommunity").then(
		(mod) => mod.seedCommunity
	);

	const submissionPubId = crypto.randomUUID() as PubsId;
	const submissionPubId2 = crypto.randomUUID() as PubsId;

	const seed = await seedCommunity({
		community: {
			name: "test",
			slug: "test-community",
		},
		pubFields: {
			Title: { schemaName: CoreSchemaType.String },
			Content: { schemaName: CoreSchemaType.String },
		},
		pubTypes: {
			Submission: {
				Title: true,
				Content: true,
			},
		},
		pubs: [
			{
				id: submissionPubId,
				pubType: "Submission",
				values: {
					Title: "My submission",
					Content: "My content",
				},
			},
			{
				id: submissionPubId2,
				pubType: "Submission",
				values: {
					Title: "Dogs and cats",
					Content: "They both like to eat.",
				},
			},
		],
	});
	expect(seed).toBeDefined();

	const pubs = await getPubs({ communityId: seed.community.id });
	expect(pubs.length).toEqual(2);

	const pubsSearch = await getPubs({ communityId: seed.community.id }, { search: "cats" });
	expect(pubsSearch.length).toEqual(1);

	rollback();
});
