"use server";

import { logger } from "logger";

import type { action } from "./action";
import { env } from "~/lib/env/env.mjs";
import { getPubsWithRelatedValues } from "~/lib/server";
import { defineRun } from "../types";

// parse Journal

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

	const result = await fetch(env.SITE_BUILDER_ENDPOINT!, {
		method: "POST",
		body: JSON.stringify({
			// journal,
			config,
		}),
	});

	if (!result.ok) {
		logger.error({ msg: "Failed to build journal site", result });
		return {
			error: "Failed to build journal site",
		};
	}

	const data = await result.json();

	logger.info({ msg: "Journal site built", data });

	return {
		success: true,
		data,
	};
});
