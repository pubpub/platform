import { writeFile } from "fs/promises";

const constructLegacyPubsUrl = (legacyCommunitySlug: string) => {
	return `https://assets.pubpub.org/legacy-archive/jtrialerror/1747149675025/static.json`;
};

export const getLegacyCommunity = async (legacyCommunitySlug: string) => {
	const url = constructLegacyPubsUrl(legacyCommunitySlug);
	const response = await fetch(url);
	const data = await response.json();

	await writeFile("./lib/server/legacy-migration/archive.json", JSON.stringify(data, null, 2));

	return data;
};
