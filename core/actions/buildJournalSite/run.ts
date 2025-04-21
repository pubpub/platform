"use server";

import { initClient } from "@ts-rest/core";

import { siteBuilderApi } from "contracts/resources/site-builder";
import { logger } from "logger";

import type { action } from "./action";
import { env } from "~/lib/env/env";
import { getPubsWithRelatedValues } from "~/lib/server";
import { getSiteBuilderToken } from "~/lib/server/apiAccessTokens";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { defineRun } from "../types";

// parse Journal

export const run = defineRun<typeof action>(async ({ pub, config, args }) => {
	const [journal, siteBuilderToken] = await Promise.all([
		getPubsWithRelatedValues(
			{
				pubId: pub.id,
				communityId: pub.communityId,
			},
			{
				depth: 5,
			}
		),
		getSiteBuilderToken(pub.communityId),
	]);

	if (!siteBuilderToken) {
		throw new Error("Site builder token not found");
	}

	const communitySlug = await getCommunitySlug();

	const siteBuilderClient = initClient(siteBuilderApi, {
		baseUrl: env.SITE_BUILDER_ENDPOINT!,
		headers: {
			authorization: `Bearer ${siteBuilderToken}`,
		},
	});

	const health = await siteBuilderClient.health();
	if (health.status !== 200) {
		logger.error({ msg: "Site builder server is not healthy", health });
		throw new Error("Site builder server is not healthy");
	}

	logger.debug({
		msg: `Initializing site build`,
		communitySlug,
		journalId: pub.id,
		mapping: config,
		uploadToS3Folder: true,
		siteUrl: `http://localhost:4321`,
		headers: {
			authorization: `Bearer ${siteBuilderToken}`,
		},
	});
	const result = await siteBuilderClient.build({
		body: {
			communitySlug,
			journalId: pub.id,
			mapping: config,
			uploadToS3Folder: true,
			siteUrl: `http://localhost:4321`,
		},
		headers: {
			authorization: `Bearer ${siteBuilderToken}`,
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

	const s3FolderUrl = data.s3FolderUrl ? new URL(data.s3FolderUrl) : undefined;
	const dataUrl = new URL(data.url);

	const rewrittenS3FolderUrl = s3FolderUrl
		? new URL(s3FolderUrl.pathname, env.ASSETS_STORAGE_ENDPOINT ?? "assets.pubpub.org")
		: undefined;
	const rewrittenDataUrl = new URL(
		dataUrl.pathname,
		env.ASSETS_STORAGE_ENDPOINT ?? "assets.pubpub.org"
	);

	return {
		success: true as const,
		report: `<div>
			<p>Journal site built</p>
			<a className="font-semibold underline" href="${rewrittenDataUrl.toString()}">Download</a>
			${rewrittenS3FolderUrl ? `<a className="font-semibold underline" href="${rewrittenS3FolderUrl.toString()}">S3 Live site</a>` : ""}
		</div>`,
		data: {
			...data,
			url: rewrittenDataUrl.toString(),
			s3FolderUrl: rewrittenS3FolderUrl?.toString(),
		},
	};
});
