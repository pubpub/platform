import { expect, test } from "vitest";

import type { ProcessedPub } from "contracts";
import type { PubsId, PubTypesId } from "db/public";
import type { DeepPartial } from "utils/types";

import { getPubTitle } from "../pubs";

const mockPub = (
	overrides?: DeepPartial<
		ProcessedPub<{
			withPubType: true;
			withRelatedPubs: false;
			withMembers: false;
			withStage: false;
		}>
	>
) => {
	const base = {
		id: "123" as PubsId,
		pubType: { id: "456" as PubTypesId, name: "Submission" },
		createdAt: new Date("2024-07-03T16:03:31.375Z"),
		values: [
			{
				value: "How to jump really high",
				fieldSlug: "pubpub:title",
			},
		],
		title: null,
	} satisfies typeof overrides;

	return (overrides ? { ...base, ...overrides } : base) as ProcessedPub<{
		withPubType: true;
		withRelatedPubs: false;
	}>;
};

test.each([
	{
		name: "pubpub:title is available but title is null",
		pub: mockPub(),
		expectedTitle: `How to jump really high`,
	},
	{
		name: "only unjournal:title",
		pub: mockPub({
			values: [
				{
					value: "Unjournal title",
					fieldSlug: "unjournal:title",
				},
			],
		}),
		expectedTitle: "Unjournal title",
	},
	{
		name: "multiple titles are available",
		pub: mockPub({
			values: [
				{
					value: "Pubpub title",
					fieldSlug: "pubpub:title",
				},
				{
					value: "Unjournal title",
					fieldSlug: "unjournal:title",
				},
			],
		}),
		expectedTitle: "Pubpub title",
	},
	{
		name: "no titles are available",
		pub: mockPub({
			values: [],
		}),
		expectedTitle: "Untitled Submission - Wed Jul 03 2024",
	},
])("getPubTitle returns valid fallback title when $name", async ({ pub, expectedTitle }) => {
	const title = getPubTitle(pub);
	expect(title).to.eql(expectedTitle);
});
