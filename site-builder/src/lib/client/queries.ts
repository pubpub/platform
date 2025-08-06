import { expect } from "utils/assert";

import { SITE_ENV } from "../env/site";
import { getClient } from "./client";

export const getPubType = async (name: string | string[]) => {
	const nameArray = Array.isArray(name) ? name : [name];

	const pubTypeId = await getClient().pubTypes.getMany({
		params: {
			communitySlug: SITE_ENV.COMMUNITY_SLUG,
		},
		query: { name: nameArray },
	});

	if (pubTypeId.status !== 200) {
		console.error(pubTypeId.body);
		throw new Error("Failed to fetch pub type");
	}

	return expect(pubTypeId.body?.filter((pubType) => nameArray.includes(pubType.name)));
};

export const getJournal = async (opts?: {
	depth?: number;
	withRelatedPubs?: boolean;
	fieldSlugs?: string[];
}) => {
	const journalPubType = await getPubType("Journal");

	const journal = await getClient().pubs.getMany({
		params: {
			communitySlug: SITE_ENV.COMMUNITY_SLUG,
		},
		query: {
			pubTypeId: [expect(journalPubType[0].id)],
			limit: 1,
			depth: opts?.depth ?? 3,
			withRelatedPubs: opts?.withRelatedPubs ?? true,
		},
	});

	if (journal.status !== 200) {
		throw new Error("Failed to fetch journal");
	}

	return expect(journal.body?.[0]);
};

export const getPages = async ({ slugs }: { slugs?: string[] } = {}) => {
	const pagePubType = await getPubType([
		"Page",
		"Collection",
		"Issue",
		"Conference Proceedings",
		"Book",
	]);

	const pages = await getClient().pubs.getMany({
		params: {
			communitySlug: SITE_ENV.COMMUNITY_SLUG,
		},
		query: {
			pubTypeId: pagePubType.map((pubType) => pubType.id),
			depth: 1,
			limit: 200,
			...(slugs && {
				filters: {
					[`${SITE_ENV.COMMUNITY_SLUG}:slug`]: {
						$in: slugs,
					},
				},
			}),
		},
	});

	if (pages.status !== 200) {
		throw new Error("Failed to fetch pages");
	}

	return expect(pages.body);
};

export const getHeader = async () => {
	const headerPubType = await getPubType("Header");

	const header = await getClient().pubs.getMany({
		params: {
			communitySlug: SITE_ENV.COMMUNITY_SLUG,
		},
		query: {
			pubTypeId: [expect(headerPubType[0].id)],
			limit: 1,
			depth: 3,
			withRelatedPubs: true,
			withPubType: true,
		},
	});

	if (header.status !== 200) {
		throw new Error("Failed to fetch header");
	}

	return expect(header.body?.[0]);
};

export const getJournalArticles = async (opts?: { limit?: number }) => {
	const journalArticlePubType = await getPubType("Journal Article");

	const journalArticles = await getClient().pubs.getMany({
		params: {
			communitySlug: SITE_ENV.COMMUNITY_SLUG,
		},
		query: {
			pubTypeId: [expect(journalArticlePubType[0].id)],
			limit: opts?.limit ?? 500,
		},
	});

	if (journalArticles.status !== 200) {
		throw new Error("Failed to fetch journal articles");
	}

	return expect(journalArticles.body);
};
