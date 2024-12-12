"use server";

import * as z from "zod";

import type { ProcessedPub } from "contracts";
import type { PubsId } from "db/public";
import { assert, expect } from "utils";

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

const makeDataciteCreatorFromAuthorPub = (pub: ProcessedPub, authorNameFieldSlug: string) => {
	const name = pub.values.find((value) => value.fieldSlug === authorNameFieldSlug)?.value;
	assert(typeof name === "string");
	return {
		name,
		affiliation: [],
		nameIdentifiers: [],
	};
};

const makeDatacitePayload = async (
	pub: ActionPub<ActionPubType>,
	config: Config
): Promise<Payload> => {
	const { values } = await getPubsWithRelatedValuesAndChildren({
		pubId: pub.id as PubsId,
		communityId: pub.communityId,
	});

	// TODO: error messages
	const urlFieldSlug = expect(config.pubFields.url?.[0]);
	const authorFieldSlug = expect(config.pubFields.author?.[0]);
	const authorNameFieldSlug = expect(config.pubFields.authorName?.[0]);
	const publicationDateFieldSlug = expect(config.pubFields.publicationDate?.[0]);

	const relatedPubs = values.filter((v) => v.relatedPub != null);
	const relatedAuthorPubs = relatedPubs
		.filter((v) => v.fieldSlug === authorFieldSlug)
		.map((v) => v.relatedPub!);

	const creators = relatedAuthorPubs.map((pub) =>
		makeDataciteCreatorFromAuthorPub(pub, authorNameFieldSlug)
	);

	const url = pub.values[urlFieldSlug];
	assert(typeof url === "string");

	const publicationDate = pub.values[publicationDateFieldSlug];
	assert(typeof publicationDate === "string");

	const publicationYear = new Date(publicationDate).getFullYear();

	assert(typeof pub.title === "string");

	return {
		data: {
			type: "dois",
			attributes: {
				doi: config.doi,
				prefix:
					config.doi === undefined
						? undefined
						: expect(
								config.doiPrefix,
								"Unable to create a DOI: the pub does not have a DOI and the action is not configured with a DOI prefix."
							),
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

const checkDoi = async (doi: string) => {
	const response = await fetch(`https://api.test.datacite.org/dois/${doi}`, {
		method: "GET",
		headers: {
			Accept: "application/vnd.api+json",
			Authorization:
				"Basic " +
				encodeDataciteCredentials(
					String(env.DATACITE_REPOSITORY_ID),
					String(env.DATACITE_PASSWORD)
				),
			"Content-Type": "application/json",
		},
	});

	return response.ok;
};

const createPubDeposit = async (payload: Payload) => {
	console.log("CREATE!");
	const response = await fetch("https://api.test.datacite.org/dois", {
		method: "POST",
		headers: {
			Accept: "application/vnd.api+json",
			Authorization:
				"Basic " +
				encodeDataciteCredentials(
					String(env.DATACITE_REPOSITORY_ID),
					String(env.DATACITE_PASSWORD)
				),
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		console.log(await response.json());
		return {
			title: "Failed to create DOI",
			error: "An error occurred while depositing the pub to DataCite.",
		};
	}

	return response.json();
};

const updatePubDeposit = async (payload: Payload) => {
	const doi = expect(payload?.data?.attributes?.doi);
	const response = await fetch(`https://api.test.datacite.org/dois/${doi}`, {
		method: "PUT",
		headers: {
			Accept: "application/vnd.api+json",
			Authorization:
				"Basic " +
				encodeDataciteCredentials(
					String(env.DATACITE_REPOSITORY_ID),
					String(env.DATACITE_PASSWORD)
				),
			"Content-Type": "application/json",
		},
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
	const depositPayload = await makeDatacitePayload(pub, depositConfig);
	const depositResult =
		// If the pub already has a DOI, and DataCite recognizes it,
		depositConfig.doi && (await checkDoi(depositConfig.doi))
			? // Update the pub metadata in DataCite
				await updatePubDeposit(depositPayload)
			: // Otherwise, deposit the pub to DataCite
				await createPubDeposit(depositPayload);

	if (isClientExceptionOptions(depositResult)) {
		return depositResult;
	}

	console.log(depositConfig.doi);

	// If the pub does not have a DOI, update the pub's DOI with the newly
	// generated DOI from DataCite
	// TODO: this should be a more explicit check, e.g. `=== undefined`, but
	// DOIs in the arcadia community seed are currently being set to "" somehow.
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
