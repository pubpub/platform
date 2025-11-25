"use server"

import type { action } from "./action"

import { initClient } from "@ts-rest/core"

import { siteBuilderApi } from "contracts/resources/site-builder"
import { logger } from "logger"
import { tryCatch } from "utils/try-catch"

import { env } from "~/lib/env/env"
import { getSiteBuilderToken } from "~/lib/server/apiAccessTokens"
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug"
import { defineRun } from "../types"

export const run = defineRun<typeof action>(async ({ pub, config }) => {
	const siteBuilderToken = await getSiteBuilderToken(pub.communityId)

	if (!siteBuilderToken) {
		throw new Error("Site builder token not found")
	}

	const communitySlug = await getCommunitySlug()

	const siteBuilderClient = initClient(siteBuilderApi, {
		baseUrl: env.SITE_BUILDER_ENDPOINT!,
		headers: {
			authorization: `Bearer ${siteBuilderToken}`,
		},
	})

	const [healthError, health] = await tryCatch(siteBuilderClient.health())
	if (healthError) {
		logger.error({ msg: "Site builder server is not healthy", healthError })
		throw new Error("Site builder server cannot be reached")
	}
	if (health.status !== 200) {
		logger.error({ msg: "Site builder server is not healthy", health })
		throw new Error("Site builder server is not healthy")
	}

	const siteUrl = config.siteUrl ?? "http://localhost:4321"

	logger.debug({
		msg: `Initializing site build`,
		communitySlug,
		journalId: pub.id,
		mapping: config,
		siteUrl,
		headers: {
			authorization: `Bearer ${siteBuilderToken}`,
		},
	})
	const [buildError, result] = await tryCatch(
		siteBuilderClient.build({
			body: {
				communitySlug,
				journalId: pub.id,
				mapping: config,
				siteUrl,
			},
			headers: {
				authorization: `Bearer ${siteBuilderToken}`,
			},
		})
	)
	if (buildError) {
		logger.error({ msg: "Failed to build journal site", buildError })
		return {
			title: "Failed to build journal site",
			error: buildError.message,
		}
	}

	if (result.status !== 200) {
		logger.error({ msg: "Failed to build journal site", result, status: result.status })
		throw new Error("Failed to build journal site")
	}

	const data = result.body

	logger.info({ msg: "Journal site built", data })

	const dataUrl = new URL(data.url)

	return {
		success: true as const,
		report: (
			<div>
				<p>Journal site built</p>
				<p>
					<a className="font-bold underline" href={dataUrl.toString()}>
						Download
					</a>
				</p>
			</div>
		),
		data: {
			...data,
			url: dataUrl.toString(),
		},
	}
})
