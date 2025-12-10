"use server"

import type { Json } from "contracts"
import type { PubsId, PubTypesId, StagesId } from "db/public"
import type { action } from "./action"

import { interpolate } from "@pubpub/json-interpolate"
import { logger } from "logger"

import { db } from "~/kysely/database"
import { getCommunity } from "~/lib/server/community"
import { getForm } from "~/lib/server/form"
import { createPubRecursiveNew } from "~/lib/server/pub"
import { createPubProxy } from "../_lib/pubProxy"
import { extractJsonata, needsInterpolation } from "../_lib/schemaWithJsonFields"
import { defineRun } from "../types"

type PubValueEntry = Json | Date | { value: Json | Date; relatedPubId: PubsId }[]

export const run = defineRun<typeof action>(async (props) => {
	const { config, communityId, lastModifiedBy, automation } = props
	const { stage, formSlug, pubValues } = config

	try {
		// Get the form and community to determine the pub type and for interpolation
		const [form, community] = await Promise.all([
			getForm({ slug: formSlug, communityId }, db).executeTakeFirstOrThrow(),
			getCommunity(communityId),
		])

		if (!community) {
			return {
				title: "Failed to create pub",
				error: "Community not found",
			}
		}

		// Build the interpolation data based on what input was provided (pub or json)
		const interpolationData =
			"pub" in props && props.pub
				? { pub: createPubProxy(props.pub, community.slug), action: automation }
				: { json: "json" in props ? props.json : {}, action: automation }

		// Interpolate any JSONata templates in pubValues
		const interpolatedPubValues: Record<string, unknown> = {}
		for (const [key, value] of Object.entries(pubValues)) {
			if (typeof value === "string" && needsInterpolation(value)) {
				const expression = extractJsonata(value)
				try {
					interpolatedPubValues[key] = await interpolate(expression, interpolationData)
				} catch (error) {
					logger.error({
						msg: "createPub: Failed to interpolate value",
						key,
						expression,
						error,
					})
					return {
						title: "Failed to create pub",
						error: `Failed to interpolate value for field: ${error instanceof Error ? error.message : "Unknown error"}`,
					}
				}
			} else {
				interpolatedPubValues[key] = value
			}
		}

		// Build a map from element ID to field slug for pubfield elements
		const elementIdToFieldSlug = new Map<string, string>()
		for (const element of form.elements) {
			if (element.type === "pubfield" && element.slug) {
				elementIdToFieldSlug.set(element.id, element.slug)
			}
		}

		// Transform pubValues from element IDs to field slugs
		const values: Record<string, PubValueEntry> = {}
		for (const [elementId, value] of Object.entries(interpolatedPubValues)) {
			const fieldSlug = elementIdToFieldSlug.get(elementId)
			if (fieldSlug) {
				values[fieldSlug] = value as PubValueEntry
			} else {
				logger.warn({
					msg: "createPub: Unknown element ID in pubValues",
					elementId,
					formSlug,
				})
			}
		}

		// Create the pub with the specified stage
		const createdPub = await createPubRecursiveNew({
			body: {
				pubTypeId: form.pubTypeId as PubTypesId,
				values,
				stageId: stage as StagesId,
			},
			communityId,
			lastModifiedBy,
		})

		logger.info({
			msg: "createPub: Pub created successfully",
			pubId: createdPub.id,
			formSlug,
			stage,
		})

		return {
			success: true,
			report: `Pub created successfully`,
			data: {
				pubId: createdPub.id,
			},
		}
	} catch (error) {
		logger.error({
			msg: "createPub: Failed to create pub",
			error,
			formSlug,
			stage,
		})

		return {
			title: "Failed to create pub",
			error:
				error instanceof Error ? error.message : "An error occurred while creating the pub",
			cause: error,
		}
	}
})
