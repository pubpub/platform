"use server";

import * as z from "zod";

import type { ProcessedPub } from "contracts";
import type { PubsId } from "db/public";
import { assert, AssertionError, expect } from "utils";

import type { ActionPub } from "../types";
import type { action } from "./action";
import type { components } from "./types";
import { env } from "~/lib/env/env.mjs";
import { getPubsWithRelatedValuesAndChildren, updatePub } from "~/lib/server";
import { isClientExceptionOptions } from "~/lib/serverActions";
import { defineRun } from "../types";

type ConfigSchema = z.infer<(typeof action)["config"]["schema"]>;
type Config = ConfigSchema & { pubFields: { [K in keyof ConfigSchema]?: string[] } };
type Payload = components["schemas"]["Doi"];

type RelatedPubs = Awaited<
	ReturnType<typeof getPubsWithRelatedValuesAndChildren<{}>>
>[number]["values"];

const encodeDataciteCredentials = (username: string, password: string) =>
	Buffer.from(`${username}:${password}`).toString("base64");

const makeDataciteCreatorFromAuthorPub = (pub: ProcessedPub, creatorNameFieldSlug: string) => {
	const name = pub.values.find((value) => value.fieldSlug === creatorNameFieldSlug)?.value;
	assert(typeof name === "string");
	return {
		name,
		// TODO: author/creator affiliations
		affiliation: [],
		nameIdentifiers: [],
	};
};

const deriveCreatorsFromRelatedPubs = (
	relatedPubs: RelatedPubs,
	creatorFieldSlug: string,
	creatorNameFieldSlug: string
) =>
	relatedPubs
		.filter((v) => v.fieldSlug === creatorFieldSlug)
		.map((v) => v.relatedPub!)
		.map((pub) => makeDataciteCreatorFromAuthorPub(pub, creatorNameFieldSlug));

const makeDatacitePayload = async (pub: ActionPub, config: Config): Promise<Payload> => {
	const titleFieldSlug = config.pubFields.title?.[0];
	const urlFieldSlug = expect(
		config.pubFields.url?.[0],
		"The DataCite action is missing a URL field override."
	);
	const creatorFieldSlug = expect(
		config.pubFields.creator?.[0],
		"The DataCite action is missing a creator field override."
	);
	const creatorNameFieldSlug = expect(
		config.pubFields.creatorName?.[0],
		"The DataCite action is missing a creator name field override."
	);
	const publicationDateFieldSlug = expect(
		config.pubFields.publicationDate?.[0],
		"The DataCite action is missing a publication date field override."
	);

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

	let title: string;

	if (titleFieldSlug !== undefined) {
		title = expect(
			pub.values.find((v) => v.fieldSlug === titleFieldSlug)?.value as string | undefined,
			"The pub has no corresponding value for the configured title field."
		);
	} else {
		title = expect(pub.title, "The pub has no title.");
	}

	const url = pub.values.find((v) => v.fieldSlug === urlFieldSlug)?.value;
	assert(
		typeof url === "string",
		"The pub is missing a value corresponding to the configured URL field override."
	);

	const publicationDate = pub.values.find((v) => v.fieldSlug === publicationDateFieldSlug)?.value;
	assert(
		typeof publicationDate === "string" || publicationDate instanceof Date,
		"The pub is missing a value corresponding to the configured publication date field override."
	);

	const publicationYear = new Date(publicationDate).getFullYear();

	let doi = config.doi;

	if (!doi) {
		assert(
			config.doiPrefix !== undefined,
			"The DataCite action must be configured with a DOI prefix to form a complete DOI."
		);

		// If a prefix and suffix exist, join the parts to make a DOI. If the
		// pub does not have a suffix, DataCite will auto-generate a DOI using
		// the prefix.
		if (config.doiSuffix) {
			doi = `${config.doiPrefix}/${config.doiSuffix}`;
		}
	}

	return {
		data: {
			type: "dois",
			attributes: {
				doi,
				prefix: config.doiPrefix,
				titles: [{ title }],
				creators,
				publisher: config.publisher,
				publicationYear,
				dates: [
					{
						date: pub.createdAt.toString(),
						dateType: "Created",
					},
					{
						date: pub.updatedAt.toString(),
						dateType: "Updated",
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

const createPubDeposit = async (depositPayload: Payload) => {
	const response = await fetch(`${env.DATACITE_API_URL}/dois`, {
		method: "POST",
		headers: makeRequestHeaders(),
		body: JSON.stringify({
			...depositPayload,
			data: {
				...depositPayload.data,
				attributes: {
					...depositPayload.data?.attributes,
					event: "publish",
				},
			},
		}),
	});

	if (!response.ok) {
		return {
			title: "Failed to create DOI",
			error: "An error occurred while depositing the pub to DataCite.",
		};
	}

	return response.json();
};

const updatePubDeposit = async (depositPayload: Payload) => {
	const doi = expect(depositPayload?.data?.attributes?.doi);
	const response = await fetch(`${env.DATACITE_API_URL}/dois/${doi}`, {
		method: "PUT",
		headers: makeRequestHeaders(),
		body: JSON.stringify(depositPayload),
	});

	if (!response.ok) {
		return {
			title: "Failed to update DOI",
			error: "An error occurred while depositing the pub to DataCite.",
		};
	}

	return response.json();
};

export const run = defineRun<typeof action>(async ({ pub, config, args, lastModifiedBy }) => {
	const depositConfig = { ...config, ...args };

	let depositPayload: Payload;
	try {
		depositPayload = await makeDatacitePayload(pub, depositConfig);
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
				await updatePubDeposit(depositPayload)
			: // Otherwise, deposit the pub to DataCite
				await createPubDeposit(depositPayload);

	if (isClientExceptionOptions(depositResult)) {
		return depositResult;
	}

	// If the pub does not have a DOI, persist the newly generated DOI from
	// DataCite
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
				lastModifiedBy,
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
		data: {
			depositConfig,
			depositPayload,
			depositResult,
		},
		success: true,
	};
});
