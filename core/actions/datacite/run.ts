"use server";

import { ParseEnglish } from "parse-english";
import rehypeRetext from "rehype-retext";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import retextStringify from "retext-stringify";
import { unified } from "unified";
import * as z from "zod";

import { logger } from "logger";
import { assert, AssertionError, expect } from "utils";

import type { ActionPub } from "../types";
import type { action } from "./action";
import type { components } from "./types";
import { env } from "~/lib/env/env";
import { getPubsWithRelatedValues, updatePub } from "~/lib/server";
import { isClientExceptionOptions } from "~/lib/serverActions";
import { defineRun } from "../types";

type ConfigSchema = z.infer<(typeof action)["config"]["schema"]>;
type Config = ConfigSchema & { pubFields: { [K in keyof ConfigSchema]?: string[] } };
type Payload = components["schemas"]["Doi"];

type RelatedPubs = Awaited<ReturnType<typeof getPubsWithRelatedValues<{}>>>[number]["values"];

const encodeDataciteCredentials = (username: string, password: string) =>
	Buffer.from(`${username}:${password}`).toString("base64");

type Always<T> = T extends null | undefined ? never : T;
type Attributes = Always<Always<components["schemas"]["Doi"]["data"]>["attributes"]>;
type Creator = Always<Attributes["creators"]>[number];
type Contributor = Always<Attributes["contributors"]>[number];

const formatTitle = async (title: string) => {
	const processor = unified()
		.use(remarkParse)
		.use(remarkRehype)
		.use(rehypeRetext, ParseEnglish)
		.use(retextStringify);
	const result = await processor.process(title);
	return result.toString().trim();
};

const deriveCreatorsFromRelatedPubs = (
	relatedPubs: RelatedPubs,
	contributorFieldSlug: string,
	contributorPersonFieldSlug: string,
	contributorPersonNameFieldSlug: string,
	contributorPersonOrcidFieldSlug?: string,
	bylineContributorFlagSlug?: string
) =>
	relatedPubs
		.filter((v) => v.fieldSlug === contributorFieldSlug)
		.reduce(
			(a, v) => {
				const contributorPub = expect(v.relatedPub);
				const contributorPerson = expect(
					contributorPub.values.find((v) => v.fieldSlug === contributorPersonFieldSlug)
						?.relatedPub,
					"A contributor does not have a related person."
				);
				const contributorPersonName = expect(
					contributorPerson.values.find(
						(v) => v.fieldSlug === contributorPersonNameFieldSlug
					)?.value,
					"A contributor person does not have a name."
				) as string;
				const contributorPersonORCID = contributorPerson.values.find(
					(v) => v.fieldSlug === contributorPersonOrcidFieldSlug,
					"A contributor person does not have an ORCID."
				)?.value as string | undefined;

				const givenNameSeparatorIndex = contributorPersonName.lastIndexOf(" ");
				const givenName = contributorPersonName.slice(0, givenNameSeparatorIndex).trim();
				const familyName = contributorPersonName.slice(givenNameSeparatorIndex + 1).trim();

				const entity = {
					name: contributorPersonName,
					nameType: "Personal" as const,
					givenName,
					familyName,
					nameIdentifiers: contributorPersonORCID
						? [
								{
									schemeUri: "https://orcid.org",
									nameIdentifier: contributorPersonORCID,
									nameIdentifierScheme: "ORCID",
								},
							]
						: [],
					affiliation: [],
				};

				const isCreator = bylineContributorFlagSlug
					? Boolean(
							contributorPub.values.find(
								(v) => v.fieldSlug === bylineContributorFlagSlug
							)?.value
						)
					: false;

				if (isCreator) {
					a.creators.push(entity);
				} else {
					a.contributors.push({ ...entity, contributorType: "Other" });
				}

				return a;
			},
			{
				creators: [] as Creator[],
				contributors: [] as Contributor[],
			}
		);

const makeDatacitePayload = async (pub: ActionPub, config: Config): Promise<Payload> => {
	const doiFieldSlug = config.pubFields.doi?.[0];
	const titleFieldSlug = config.pubFields.title?.[0];
	const urlFieldSlug = expect(
		config.pubFields.url?.[0],
		"The DataCite action is missing a URL field override."
	);
	const contributorFieldSlug = expect(
		config.pubFields.contributor?.[0],
		"The DataCite action is missing a contributor field override."
	);
	const contributorPersonFieldSlug = expect(
		config.pubFields.contributorPerson?.[0],
		"The DataCite action is missing a contributor person field override."
	);
	const contributorPersonNameSlug = expect(
		config.pubFields.contributorPersonName?.[0],
		"The DataCite action is missing a contributor person name field override."
	);
	const contributorPersonOrcidSlug = config.pubFields.contributorPersonORCID?.[0];
	const bylineContributorFlagSlug = config.pubFields.bylineContributorFlag?.[0];
	const publicationDateFieldSlug = expect(
		config.pubFields.publicationDate?.[0],
		"The DataCite action is missing a publication date field override."
	);

	const relatedPubs = pub.values.filter((v) => v.relatedPub != null);

	const { contributors, creators } = deriveCreatorsFromRelatedPubs(
		relatedPubs,
		contributorFieldSlug,
		contributorPersonFieldSlug,
		contributorPersonNameSlug,
		contributorPersonOrcidSlug,
		bylineContributorFlagSlug
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

	title = await formatTitle(title);

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

	const publicationDateNormalized = new Date(publicationDate);
	const publicationYear = publicationDateNormalized.getFullYear();

	let doi =
		config.doi ||
		(pub.values.find((v) => v.fieldSlug === doiFieldSlug)?.value as string | undefined);

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
				contributors,
				publisher: config.publisher,
				publicationYear,
				dates: [
					{
						dateType: "Issued",
						date: publicationDateNormalized.toISOString(),
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

	logger.info({
		msg: "Datacite DOI check",
		doi,
		response: {
			status: response.status,
			statusText: response.statusText,
			url: response.url,
			body: await response.text(),
		},
	});

	return response.ok;
};

const createPubDeposit = async (depositPayload: Payload) => {
	logger.info({
		msg: "Datacite deposit publish",
		payload: {
			...depositPayload.data,
			attributes: {
				...depositPayload.data?.attributes,
				event: "publish",
			},
		},
	});
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
		logger.error({
			ms: "DataCite deposit publish error",
			response: {
				status: response.status,
				statusText: response.statusText,
				url: response.url,
				body: await response.text(),
			},
		});
		return {
			title: "Failed to create DOI",
			error: "An error occurred while depositing the pub to DataCite.",
		};
	}

	return response.json();
};

const updatePubDeposit = async (depositPayload: Payload) => {
	logger.info({
		msg: "Datacite deposit update",
		payload: depositPayload,
	});
	const doi = expect(depositPayload?.data?.attributes?.doi);
	const response = await fetch(`${env.DATACITE_API_URL}/dois/${doi}`, {
		method: "PUT",
		headers: makeRequestHeaders(),
		body: JSON.stringify(depositPayload),
	});

	if (!response.ok) {
		logger.error({
			ms: "DataCite deposit update error",
			response: {
				status: response.status,
				statusText: response.statusText,
				url: response.url,
				body: await response.text(),
			},
		});
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

	const depositPayloadDoi = depositPayload?.data?.attributes?.doi;
	const depositResult =
		// If the pub already has a DOI, and DataCite recognizes it,
		depositPayloadDoi && (await checkDoi(depositPayloadDoi))
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
		const doiFieldSlug = expect(config.pubFields.doi?.[0], "Missing DOI field slug");

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
				cause: error.message,
			};
		}
	}

	return {
		data: {
			doi: depositResult.data.attributes.doi,
		},
		success: true,
	};
});
