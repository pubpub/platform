import { expect } from "utils/assert";

import { SITE_ENV } from "../env/site";
import { getClient } from "./client";

export const getPubType = async (name: string) => {
	const pubTypeId = await getClient().pubTypes.getMany({
		params: {
			communitySlug: SITE_ENV.COMMUNITY_SLUG,
		},
		query: { name },
	});

	if (pubTypeId.status !== 200) {
		console.error(pubTypeId.body);
		throw new Error("Failed to fetch pub type");
	}

	return expect(pubTypeId.body?.[0]);
};

export const getJournal = async (opts?: { depth?: number; withRelatedPubs?: boolean }) => {
	const journalPubType = await getPubType("Journal");

	const journal = await getClient().pubs.getMany({
		params: {
			communitySlug: SITE_ENV.COMMUNITY_SLUG,
		},
		query: {
			pubTypeId: [expect(journalPubType.id)],
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

export const getJournalArticles = async (opts?: { limit?: number }) => {
	const journalArticlePubType = await getPubType("Journal Article");

	const journalArticles = await getClient().pubs.getMany({
		params: {
			communitySlug: SITE_ENV.COMMUNITY_SLUG,
		},
		query: {
			pubTypeId: [expect(journalArticlePubType.id)],
			limit: opts?.limit ?? 500,
		},
	});

	if (journalArticles.status !== 200) {
		throw new Error("Failed to fetch journal articles");
	}

	return expect(journalArticles.body);
};
