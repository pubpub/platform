"use server";

import * as z from "zod";

import type { ProcessedPub } from "contracts";
import type { PubsId } from "db/public";
import { assert, AssertionError, expect } from "utils";

import type { ActionPub, ActionPubType } from "../types";
import type { action } from "./action";
import type { components } from "./types";
import { env } from "~/lib/env/env.mjs";
import { getPubsWithRelatedValuesAndChildren, updatePub } from "~/lib/server";
import { isClientExceptionOptions } from "~/lib/serverActions";
import { defineRun } from "../types";

type ConfigSchema = z.infer<(typeof action)["config"]["schema"]>;
type Config = ConfigSchema & { pubFields: { [K in keyof ConfigSchema]?: string[] } };
type Payload = components["schemas"]["Doi"];

const encodeDataciteCredentials = (username: string, password: string) =>
	Buffer.from(`${username}:${password}`).toString("base64");

const makeDataciteCreatorFromAuthorPub = (pub: ProcessedPub, creatorNameFieldSlug: string) => {
	const name = pub.values.find((value) => value.fieldSlug === creatorNameFieldSlug)?.value;
	assert(typeof name === "string");
	return {
		name,
		affiliation: [],
		nameIdentifiers: [],
	};
};

type RelatedPubs = Awaited<
	ReturnType<typeof getPubsWithRelatedValuesAndChildren<{}>>
>[number]["values"];

const deriveCreatorsFromRelatedPubs = (
	relatedPubs: RelatedPubs,
	creatorFieldSlug: string,
	creatorNameFieldSlug: string
) =>
	relatedPubs
		.filter((v) => v.fieldSlug === creatorFieldSlug)
		.map((v) => v.relatedPub!)
		.map((pub) => makeDataciteCreatorFromAuthorPub(pub, creatorNameFieldSlug));

const makeDatacitePayload = async (
	pub: ActionPub<ActionPubType>,
	config: Config
): Promise<Payload> => {
	// TODO: error messages
	const urlFieldSlug = expect(config.pubFields.url?.[0]);
	const creatorFieldSlug = expect(config.pubFields.creator?.[0]);
	const creatorNameFieldSlug = expect(config.pubFields.creatorName?.[0]);
	const publicationDateFieldSlug = expect(config.pubFields.publicationDate?.[0]);

	const { values } = await getPubsWithRelatedValuesAndChildren({
		pubId: pub.id as PubsId,
		communityId: pub.communityId,
	});

	const relatedPubs = values.filter((v) => v.relatedPub != null);

	const creators = deriveCreatorsFromRelatedPubs(
		relatedPubs,
		creatorFieldSlug,
		creatorNameFieldSlug
	);

	const url = pub.values[urlFieldSlug];
	assert(typeof url === "string");

	const publicationDate = pub.values[publicationDateFieldSlug];
	assert(typeof publicationDate === "string");

	const publicationYear = new Date(publicationDate).getFullYear();

	assert(typeof pub.title === "string");

	const prefix =
		config.doi === undefined
			? expect(
					config.doiPrefix,
					"The pub does not have a DOI and the DataCite action is not configured with a DOI prefix."
				)
			: undefined;

	return {
		data: {
			type: "dois",
			attributes: {
				doi: config.doi,
				prefix,
				titles: [{ title: pub.title }],
				creators,
				publisher: config.publisher,
				publicationYear,
				dates: [
					{
						date: pub.createdAt.toString(),
						dateType: "Created",
					},
				],
				types: {
					resourceTypeGeneral: "Preprint",
				},
				url,
			},
		},
	};
};

const makeRequestHeaders = () => {
	return {
		Accept: "application/vnd.api+json",
		Authorization:
			"Basic " +
			encodeDataciteCredentials(
				String(env.DATACITE_REPOSITORY_ID),
				String(env.DATACITE_PASSWORD)
			),
		"Content-Type": "application/json",
	};
};

const checkDoi = async (doi: string) => {
	const response = await fetch(`${env.DATACITE_API_URL}/dois/${doi}`, {
		method: "GET",
		headers: makeRequestHeaders(),
	});

	return response.ok;
};

const createPubDeposit = async (payload: Payload) => {
	const response = await fetch(`${env.DATACITE_API_URL}/dois`, {
		method: "POST",
		headers: makeRequestHeaders(),
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		return {
			title: "Failed to create DOI",
			error: "An error occurred while depositing the pub to DataCite.",
		};
	}

	return response.json();
};

const updatePubDeposit = async (payload: Payload) => {
	const doi = expect(payload?.data?.attributes?.doi);
	const response = await fetch(`${env.DATACITE_API_URL}/dois/${doi}`, {
		method: "PUT",
		headers: makeRequestHeaders(),
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		return {
			title: "Failed to update DOI",
			error: "An error occurred while depositing the pub to DataCite.",
		};
	}

	return response.json();
};

export const run = defineRun<typeof action>(async ({ pub, config, args }) => {
	const depositConfig = { ...config, ...args };

	let payload: Payload;
	try {
		payload = await makeDatacitePayload(pub, depositConfig);
	} catch (error) {
		if (error instanceof AssertionError) {
			return {
				title: "Failed to create DataCite deposit",
				error: error.message,
				cause: undefined,
			};
		}
		throw error;
	}

	const depositResult =
		// If the pub already has a DOI, and DataCite recognizes it,
		depositConfig.doi && (await checkDoi(depositConfig.doi))
			? // Update the pub metadata in DataCite
				await updatePubDeposit(payload)
			: // Otherwise, deposit the pub to DataCite
				await createPubDeposit(payload);

	if (isClientExceptionOptions(depositResult)) {
		return depositResult;
	}

	// If the pub does not have a DOI, update the pub's DOI with the newly
	// generated DOI from DataCite
	if (!depositConfig.doi) {
		const doiFieldSlug = expect(config.pubFields.doi?.[0]);
		try {
			await updatePub({
				pubId: pub.id,
				communityId: pub.communityId,
				pubValues: {
					[doiFieldSlug]: depositResult.data.attributes.doi,
				},
				continueOnValidationError: false,
			});
		} catch (error) {
			return {
				title: "Failed to save DOI",
				error: "The pub was deposited to DataCite, but we were unable to update the pub's DOI in PubPub",
				cause: error,
			};
		}
	}

	return {
		data: {},
		success: true,
	};
});
