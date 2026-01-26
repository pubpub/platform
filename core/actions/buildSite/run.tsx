"use server"

import type { action } from "./action"

import { initClient } from "@ts-rest/core"

import { interpolate } from "@pubpub/json-interpolate"
import { siteBuilderApi } from "contracts/resources/site-builder-2"
import { logger } from "logger"
import { tryCatch } from "utils/try-catch"

import { env } from "~/lib/env/env"
import { getPubTitle } from "~/lib/pubs"
import { getPubsWithRelatedValues } from "~/lib/server"
import { getSiteBuilderToken } from "~/lib/server/apiAccessTokens"
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug"
import { getCommunity } from "~/lib/server/community"
import { applyJsonataFilter, compileJsonataQuery } from "~/lib/server/jsonata-query"
import { buildInterpolationContext } from "../_lib/interpolationContext"
import { defineRun } from "../types"

export const run = defineRun<typeof action>(
	async ({ communityId, pub, config, automationRunId }) => {
		const community = await getCommunity(communityId)
		const siteBuilderToken = await getSiteBuilderToken(communityId)

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

		const _pages = await Promise.all(
			config.pages.map(async (page) => {
				const query = compileJsonataQuery(page.filter)

				const pubs = await getPubsWithRelatedValues(
					{ communityId },
					{
						customFilter: (eb) => applyJsonataFilter(eb, query, { communitySlug }),
						depth: 1,
						withValues: true,
					}
				)

				const pubContext = buildInterpolationContext({
					community,
					pub,
					env: { PUBPUB_URL: env.PUBPUB_URL },
					useDummyValues: true,
				})
				const [error, slug] = await tryCatch(interpolate(page.slug, pubContext))
				logger.error({
					msg: "Error interpolating slug . Will continue with pub id.",
					error,
				})
				const slllug = error ? pub.id : slug

				return {
					pages: pubs.map((pub) => ({
						id: pub.id,
						title: getPubTitle(pub),
						content: page.transform,
						slug: slllug,
					})),
					transform: page.transform,
				}
			})
		)

		const [healthError, health] = await tryCatch(siteBuilderClient.health())
		if (healthError) {
			logger.error({ msg: "Site builder server is not healthy", healthError })
			throw new Error("Site builder server cannot be reached")
		}
		if (health.status !== 200) {
			logger.error({ msg: "Site builder server is not healthy", health })
			throw new Error("Site builder server is not healthy")
		}

		logger.debug({
			msg: `Initializing site build`,
			communitySlug,
			mapping: config,
			headers: {
				authorization: `Bearer ${siteBuilderToken}`,
			},
		})
		console.log("AAAAAAAAAAAAAAA", _pages[0].pages)

		const [buildError, result] = await tryCatch(
			siteBuilderClient.build({
				body: {
					automationRunId: automationRunId,
					communitySlug,
					pages: _pages,
					siteUrl: "https://gamer.com",
				},
				headers: {
					authorization: `Bearer ${siteBuilderToken}`,
				},
			})
		)
		if (buildError) {
			logger.error({ msg: "Failed to build journal site", buildError })
			return {
				success: false,
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
	}
)
