"use server";

import { unstable_cache } from "next/cache";
import { defaultMarkdownParser } from "prosemirror-markdown";

import { logger } from "logger";

import type { action } from "./action";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { ClientExceptionOptions } from "~/lib/serverActions";
import { db } from "~/kysely/database";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { isClientExceptionOptions } from "~/lib/serverActions";
import * as corePubFields from "../corePubFields";
import { defineRun } from "../types";

const authError = {
	title: "Error pushing pub to v6",
	error: "The auth token provided is does not grant access to the provided community",
};

const communitySlugError = {
	title: "Error pushing pub to v6",
	error: "The community slug provided does not exist",
};

const getV6Community = async (
	communitySlug: string,
	authToken: string
): Promise<{ id: string } | ClientExceptionOptions> => {
	const getV6CommunityRequest = await fetch(
		`https://${communitySlug}.pubpub.org/api/communities`,
		{
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${authToken}`,
			},
		}
	);

	switch (getV6CommunityRequest.status) {
		case 403:
			return authError;
		case 404:
			return communitySlugError;
		case 200:
			return ((await getV6CommunityRequest.json()) as { id: string }[])[0];
		default:
			return {
				title: "Error finding v6 community",
				error: "An error occurred while getting the v6 community",
			};
	}
};

const createV6Pub = async (
	communitySlug: string,
	authToken: string,
	communityId: string,
	title: string
): Promise<{ id: string } | ClientExceptionOptions> => {
	const createV6PubResponse = await fetch(`https://${communitySlug}.pubpub.org/api/pubs`, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${authToken}`,
		},
		body: JSON.stringify({
			communityId,
			title,
		}),
	});

	switch (createV6PubResponse.status) {
		case 403:
			return authError;
		case 404:
			return communitySlugError;
		case 201:
			return await createV6PubResponse.json();
		default:
			return {
				title: "Error creating v6 pub",
				error: "An error occurred while creating a new v6 pub",
			};
	}
};

const getV6Pub = async (
	v6PubId: string,
	communitySlug: string,
	authToken: string
): Promise<{ id: string } | null | ClientExceptionOptions> => {
	const getV6PubResponse = await fetch(
		`https://${communitySlug}.pubpub.org/api/pubs/${v6PubId}`,
		{
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${authToken}`,
			},
		}
	);

	switch (getV6PubResponse.status) {
		case 403:
			return authError;
		case 404:
			return null;
		case 200:
			return (await getV6PubResponse.json()) as { id: string };
		default:
			return {
				title: "Error getting v6 pub",
				error: "An error occurred while getting the v6 pub",
			};
	}
};

const updateV6PubText = async (
	v6PubId: string,
	communitySlug: string,
	authToken: string,
	content: string
): Promise<true | ClientExceptionOptions> => {
	const updateV6PubTextRequest = await fetch(
		`https://${communitySlug}.pubpub.org/api/pubs/${v6PubId}/text`,
		{
			method: "PUT",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${authToken}`,
			},
			body: JSON.stringify({
				doc: defaultMarkdownParser.parse(content),
			}),
		}
	);

	switch (updateV6PubTextRequest.status) {
		case 403:
			return authError;
		case 404:
			return {
				title: "Error updating v6 pub content",
				error: "The related v6 pub does not exist",
			};
		case 200:
		case 204:
			return true;
		default:
			return {
				title: "Error updating v6 pub content",
				error: "An error occurred while updating the v6 pub content",
			};
	}
};

const updateV6PubId = async (pubId: string, v6PubId: string) => {
	await autoRevalidate(
		db
			.with("field", (db) =>
				db
					.selectFrom("pub_fields")
					.select("id")
					.where("slug", "=", corePubFields.v6PubId.slug)
			)
			.insertInto("pub_values")
			.values((eb) => ({
				field_id: eb.selectFrom("field").select("field.id"),
				pub_id: pubId as PubsId,
				value: `"${v6PubId}"`,
			}))
	).execute();
};

export const run = defineRun<typeof action>(async ({ pub, config, runParameters }) => {
	try {
		const v6Community = await getV6Community(config.communitySlug, config.authToken);

		if (isClientExceptionOptions(v6Community)) {
			return v6Community;
		}

		let v6Pub: { id: string };

		// Fetch the pub if the v7 pub already had a v6 pub id
		if (pub.values[corePubFields.v6PubId.slug]) {
			const v6PubId = pub.values[corePubFields.v6PubId.slug] as string;
			const v6PubResult = await getV6Pub(v6PubId, config.communitySlug, config.authToken);

			if (isClientExceptionOptions(v6PubResult)) {
				return v6PubResult;
			}

			if (v6PubResult !== null) {
				v6Pub = v6PubResult;
			}
		}

		// Create the pub if the v7 pub did not have a v6 pub id or if the v6 pub
		// id was invalid (e.g. the v6 pub was deleted)
		if (v6Pub! === undefined) {
			const createV6PubResponse = await createV6Pub(
				config.communitySlug,
				config.authToken,
				v6Community.id,
				pub.values[corePubFields.title.slug]
			);

			if (isClientExceptionOptions(createV6PubResponse)) {
				return createV6PubResponse;
			}

			v6Pub = createV6PubResponse;

			// Update the v6 pub id in the v7 pub
			await updateV6PubId(pub.id, v6Pub.id);
		}

		// Update the v6 pub content
		const updateV6PubTextRequest = await updateV6PubText(
			v6Pub.id,
			config.communitySlug,
			config.authToken,
			pub.values[corePubFields.content.slug]
		);

		if (isClientExceptionOptions(updateV6PubTextRequest)) {
			return updateV6PubTextRequest;
		}
	} catch (error) {
		return {
			title: "Error pushing pub to v6",
			error: "An error occurred while pushing the pub to v6",
			cause: error,
		};
	}

	logger.info({ msg: "pub pushed to v6", pub, config, runParameters });

	return {
		success: true,
		report: "The pub was successfully pushed to v6",
		data: {},
	};
});
