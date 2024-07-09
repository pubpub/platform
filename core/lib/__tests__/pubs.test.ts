import { expect, test } from "vitest";

import type { PubPayload } from "../types";
import { getPubTitle } from "../pubs";

const mockPub = (overrides?: Partial<PubPayload>) => {
	const base = {
		id: "123",
		pubType: { id: "456", name: "Submission" },
		createdAt: new Date("2024-07-03T16:03:31.375Z"),
		values: [
			{
				value: "How to jump really high",
				field: { slug: "pubpub:title" },
			},
		],
	} as PubPayload;

	return overrides ? { ...base, ...overrides } : base;
};

test.each([
	{ name: "pubpub:title is available", pub: mockPub(), expectedTitle: "How to jump really high" },
	{
		name: "only unjournal:title",
		pub: mockPub({
			values: [
				{
					value: "Unjournal title",
					field: { slug: "unjournal:title" },
				} as PubPayload["values"][number],
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
					field: { slug: "pubpub:title" },
				} as PubPayload["values"][number],
				{
					value: "Unjournal title",
					field: { slug: "unjournal:title" },
				} as PubPayload["values"][number],
			],
		}),
		expectedTitle: "Pubpub title",
	},
	{
		name: "no titles are available",
		pub: mockPub({
			values: [],
		}),
		expectedTitle: "Untitled Pub - Wed Jul 03 2024",
	},
])("getPubTitle returns valid title when $name", async ({ pub, expectedTitle }) => {
	const title = getPubTitle(pub);
	expect(title).to.eql(expectedTitle);
});
