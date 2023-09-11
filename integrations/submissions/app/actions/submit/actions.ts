"use server";

import { Pub } from "@pubpub/sdk";
import manifest from "pubpub-integration.json";
import { assert, expect } from "utils";
import { findInstance } from "~/lib/instance";
import { makePubFromCrossrefDoi, makePubFromTitle, makePubFromUrl } from "~/lib/metadata";
import { client } from "~/lib/pubpub";

export const submit = async (instanceId: string, pub: Pub<typeof manifest>) => {
	try {
		assert(typeof instanceId === "string");
		const instance = expect(await findInstance(instanceId));
		const response = await client.create(
			instanceId,
			pub as Pub<typeof manifest>,
			instance.pubTypeId
		);
		return response;
	} catch (error) {
		return { error: error.message };
	}
};

type Update = Record<string, string | Date | null>;

const metadataResolvers = {
	DOI: makePubFromCrossrefDoi,
	URL: makePubFromUrl,
	Title: makePubFromTitle,
};

export const fetchMetadataUsingIdentifier = async (
	identifierKind: string,
	identifierValue: string
): Promise<Update | { error: string }> => {
	const resolve = metadataResolvers[identifierKind];
	if (resolve !== undefined) {
		const pub = await resolve(identifierValue);
		if (pub !== null) {
			return pub;
		}
	}
	return { error: "Unable to fetch metadata" };
};
