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

const PUBLISHED_AT_FIELD = "arcadia:publication-year";
const CREATOR_FIELD = "arcadia:author";
const AUTHOR_FIRST_NAME = "arcadia:first-name";
const AUTHOR_LAST_NAME = "arcadia:last-name";

const makeDataciteCreatorFromAuthorPub = (pub: ProcessedPub) => {
	const firstName = expect(
		pub.values.find((value) => value.fieldSlug === AUTHOR_FIRST_NAME)?.value
	);
	const lastName = expect(
		pub.values.find((value) => value.fieldSlug === AUTHOR_LAST_NAME)?.value
	);
	return {
		name: `${firstName} ${lastName}`,
		affiliation: [],
		nameIdentifiers: [],
	};
};

const encodeDataciteCredentials = (username: string, password: string) =>
	Buffer.from(`${username}:${password}`).toString("base64");

const createDataciteDeposit = async (
	pub: ActionPub<ActionPubType>,
	config: z.infer<(typeof action)["config"]["schema"]>
): Promise<DataciteDoiPayload> => {
	const { values } = await getPubsWithRelatedValuesAndChildren({
		pubId: pub.id as PubsId,
		communityId: pub.communityId,
	});
	const relatedPubs = values.filter((v) => v.relatedPub != null);
	const relatedAuthorPubs = relatedPubs
		.filter((v) => v.fieldSlug === CREATOR_FIELD)
		.map((v) => v.relatedPub!);

	const creators = relatedAuthorPubs.map(makeDataciteCreatorFromAuthorPub);

	const publishedAt = pub.values[PUBLISHED_AT_FIELD];
	assert(typeof publishedAt === "string");

	const publicationYear = new Date(publishedAt).getFullYear();

	return {
		data: {
			type: "dois",
			attributes: {
				doi: config.doi,
				event: "publish",
				creators,
				publisher: config.publisher,
				// TODO:
				publicationYear,
				dates: [
					{
						date: pub.createdAt.toString(),
						dateType: "Created",
					},
				],
			},
		},
	};
};

const createPubDeposit = async (payload: DataciteDoiPayload) => {
	const response = await fetch("https://api.test.datacite.org/dois", {
		method: "POST",
		headers: {
			"Content-Type": "application/vnd.api+json",
			Authorization:
				"Basic " +
				encodeDataciteCredentials(
					String(env.DATACITE_REPOSITORY_ID),
					String(env.DATACITE_PASSWORD)
				),
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		return {
			title: "Failed to create DOI",
			error: "An error occurred while depositing the pub to DataCite.",
		};
	}
};

const updatePubDeposit = async (payload: DataciteDoiPayload) => {
	const doi = expect(typeof payload?.data?.attributes?.doi);
	const response = await fetch(`https://api.test.datacite.org/dois/${doi}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/vnd.api+json",
			Authorization:
				"Basic " +
				encodeDataciteCredentials(
					String(env.DATACITE_REPOSITORY_ID),
					String(env.DATACITE_PASSWORD)
				),
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

const updatePubDoi = async (pub: ActionPub<ActionPubType>, doi: string, doiFieldSlug: string) =>
	updatePub({
		pubId: pub.id as PubsId,
		communityId: pub.communityId,
		pubValues: {
			[doiFieldSlug]: doi,
		},
		continueOnValidationError: false,
	});

export const run = defineRun<typeof action>(async ({ pub, config, args }) => {
	const payload = await createDataciteDeposit(pub, { ...config, ...args });
	const doiFieldSlug = expect(
		config.pubFields.doi?.[0],
		"The DataCite action's DOI setting must be configured with a pub field."
	);
	const doi = expect(payload?.data?.attributes?.doi);

	if (doi === undefined) {
		const result = await createPubDeposit(payload);
		if (isClientExceptionOptions(result)) {
			return result;
		}
		try {
			await updatePubDoi(pub, doi, doiFieldSlug);
		} catch (error) {
			return {
				title: "Failed to update DOI",
				error: "The pub was deposited in DataCite successfully, but we failed to update the DOI in PubPub.",
				cause: error,
			};
		}
	} else {
		const result = await updatePubDeposit(payload);
		if (isClientExceptionOptions(result)) {
			return result;
		}
	}

	return {
		data: {},
		success: true,
	};
});
