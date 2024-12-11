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

type DataciteDoiPayload = components["schemas"]["Doi"];

const TEMP_TITLE_FIELD_SLUG = "croccroc:title";

const makeDataciteCreatorFromAuthorPub = (
	pub: ProcessedPub,
	firstNameFieldSlug: string,
	lastNameFieldSlug: string
) => {
	const firstName = expect(
		pub.values.find((value) => value.fieldSlug === firstNameFieldSlug)?.value
	);
	const lastName = expect(
		pub.values.find((value) => value.fieldSlug === lastNameFieldSlug)?.value
	);
	return {
		name: `${firstName} ${lastName}`,
		affiliation: [],
		nameIdentifiers: [],
	};
};

const encodeDataciteCredentials = (username: string, password: string) =>
	Buffer.from(`${username}:${password}`).toString("base64");

// TODO: Use existing types/make this better!
type Schema = z.infer<(typeof action)["config"]["schema"]>;
type Config = Schema & { pubFields: { [K in keyof Schema]?: string[] } };

const createDataciteDeposit = async (
	pub: ActionPub<ActionPubType>,
	config: Config
): Promise<DataciteDoiPayload> => {
	const { values } = await getPubsWithRelatedValuesAndChildren({
		pubId: pub.id as PubsId,
		communityId: pub.communityId,
	});

	// TODO: error messages
	const urlFieldSlug = expect(config.pubFields.url?.[0]);
	const authorFieldSlug = expect(config.pubFields.author?.[0]);
	const authorFirstNameFieldSlug = expect(config.pubFields.authorFirstName?.[0]);
	const authorLastNameFieldSlug = expect(config.pubFields.authorLastName?.[0]);
	const publicationDateFieldSlug = expect(config.pubFields.publicationDate?.[0]);

	const relatedPubs = values.filter((v) => v.relatedPub != null);
	const relatedAuthorPubs = relatedPubs
		.filter((v) => v.fieldSlug === authorFieldSlug)
		.map((v) => v.relatedPub!);

	const creators = relatedAuthorPubs.map((pub) =>
		makeDataciteCreatorFromAuthorPub(pub, authorFirstNameFieldSlug, authorLastNameFieldSlug)
	);

	const title = pub.values[TEMP_TITLE_FIELD_SLUG];
	assert(typeof title === "string");

	const url = pub.values[urlFieldSlug];
	assert(typeof url === "string");

	const publicationDate = pub.values[publicationDateFieldSlug];
	assert(typeof publicationDate === "string");

	const publicationYear = new Date(publicationDate).getFullYear();

	return {
		data: {
			type: "dois",
			attributes: {
				doi: config.doi,
				titles: [{ title }],
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

const createPubDeposit = async (payload: DataciteDoiPayload) => {
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
};

const updatePubDeposit = async (payload: DataciteDoiPayload) => {
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
};

export const run = defineRun<typeof action>(async ({ pub, config, args }) => {
	const depositConfig = { ...config, ...args };
	const depositPayload = await createDataciteDeposit(pub, depositConfig);
	const depositResult = (await checkDoi(depositConfig.doi))
		? await updatePubDeposit(depositPayload)
		: await createPubDeposit(depositPayload);

	return isClientExceptionOptions(depositResult)
		? depositResult
		: {
				data: {},
				success: true,
			};
});
