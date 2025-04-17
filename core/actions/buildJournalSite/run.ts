"use server";

import { logger } from "logger";

import type { action } from "./action";
import { env } from "~/lib/env/env.mjs";
import { getPubsWithRelatedValues } from "~/lib/server";
import { defineRun } from "../types";

// parse Journal

type BuildResponse = {
	success: true;
	message: string;
	url: string;
	timestamp: number;
	fileSize: number;
	fileSizeFormatted: string;
};

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

	const result = await fetch(`${env.SITE_BUILDER_ENDPOINT}/build`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.SITE_BUILDER_API_KEY}`,
		},
		body: JSON.stringify({
			// journal,
			config,
		}),
	});

	if (!result.ok) {
		logger.error({ msg: "Failed to build journal site", result, status: result.status });
		return {
			error: "Failed to build journal site",
		};
	}

	const data = await result.json();

	logger.info({ msg: "Journal site built", data });

	return {
		success: true,
		report: `<div>
			<p>Journal site built</p>
			<p>The resulting URL is:</p>
			<a href="${data.url}">${data.url}</a>
		</div>`,
		data,
	};
});
