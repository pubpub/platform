"use server";

import { initClient } from "@ts-rest/core";

import { siteBuilderApi } from "contracts/resources/site-builder";
import { logger } from "logger";

import type { action } from "./action";
import { env } from "~/lib/env/env.mjs";
import { getPubsWithRelatedValues } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { defineRun } from "../types";

// parse Journal

const siteBuilderClient = initClient(siteBuilderApi, {
	baseUrl: env.SITE_BUILDER_ENDPOINT!,
	baseHeaders: {
		Authorization: `Bearer ${env.SITE_BUILDER_API_KEY}`,
	},
});

export const run = defineRun<typeof action>(async ({ pub, config, args }) => {
	const journal = await getPubsWithRelatedValues(
		{
			pubId: pub.id,
			communityId: pub.communityId,
		},
		{
			depth: 5,
		}
	);

	const communitySlug = await getCommunitySlug();

	const result = await siteBuilderClient.build({
		body: {
			communitySlug,
			journalId: pub.id,
			mapping: config,
			uploadToS3Folder: true,
			siteUrl: `http://localhost:4321`,
		},
	});

	if (result.status !== 200) {
		logger.error({ msg: "Failed to build journal site", result, status: result.status });
		return {
			error: "Failed to build journal site",
		};
	}

	const data = result.body;

	logger.info({ msg: "Journal site built", data });

	const s3FolderUrl = data.s3FolderUrl;

	return {
		success: true as const,
		report: `<div>
			<p>Journal site built</p>
			<a className="font-semibold underline" href="${data.url}">Download</a>
			${s3FolderUrl ? `<a className="font-semibold underline" href="${s3FolderUrl}">S3 Live site</a>` : ""}
		</div>`,
		data,
	};
});
