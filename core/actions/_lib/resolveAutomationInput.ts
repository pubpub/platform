import type { ProcessedPub } from "contracts"
import type { CommunitiesId, PubsId } from "db/public"
import type { FullAutomation, Json } from "db/types"

import { interpolate } from "@pubpub/json-interpolate"
import { logger } from "logger"
import { tryCatch } from "utils/try-catch"

import { db } from "~/kysely/database"
import { getPubsWithRelatedValues } from "~/lib/server"
import type { InterpolationContext } from "./interpolationContext"

type ResolvedPub = ProcessedPub<{
	withPubType: true
	withRelatedPubs: true
	withStage: false
	withValues: true
}>

export type ResolvedInput =
	| { type: "pub"; pub: ResolvedPub }
	| { type: "json"; json: Json }
	| { type: "unchanged" }

type ResolverExpressionType =
	| { kind: "comparison"; leftPath: string; operator: string; rightPath: string }
	| { kind: "transform" }
	| { kind: "unknown" }

/**
 * Parses a resolver expression to understand its structure.
 *
 * Supports comparison expressions like:
 * - `$.json.some.id = $.pub.values.fieldname` - matches incoming json against pub field values
 * - `$.pub.id = someExternalId` - matches pub by id
 *
 * Or transformation expressions that just transform the input.
 */
function parseResolverExpression(expression: string): ResolverExpressionType {
	// Simple regex to detect comparison patterns
	// This handles basic cases like `$.path.to.value = $.other.path`
	const comparisonMatch = expression.match(
		/^\s*(\$\.[^\s=!<>]+)\s*(=|!=|<|>|<=|>=)\s*(\$\.[^\s]+|\S+)\s*$/
	)

	if (comparisonMatch) {
		const [, leftPath, operator, rightPath] = comparisonMatch
		return {
			kind: "comparison",
			leftPath,
			operator,
			rightPath,
		}
	}

	// Check if it looks like a transform (returns an object or processes data)
	if (expression.includes("{") || expression.includes("$map") || expression.includes("$filter")) {
		return { kind: "transform" }
	}

	return { kind: "unknown" }
}

/**
 * Extracts the field slug from a pub values path like `$.pub.values.fieldname`
 * Returns null if the path doesn't match the expected pattern.
 */
function extractFieldSlugFromPath(path: string): string | null {
	// Handle both formats:
	// - $.pub.values.fieldname
	// - $.pub.values["field-name"] or $.pub.values['field-name']
	const simpleMatch = path.match(/^\$\.pub\.values\.([a-zA-Z_][a-zA-Z0-9_-]*)$/)
	if (simpleMatch) {
		return simpleMatch[1]
	}

	const bracketMatch = path.match(/^\$\.pub\.values\[["']([^"']+)["']\]$/)
	if (bracketMatch) {
		return bracketMatch[1]
	}

	return null
}

/**
 * Extracts pubId from a path like `$.pub.id`
 */
function isPubIdPath(path: string): boolean {
	return path === "$.pub.id"
}

/**
 * Resolves a value from the interpolation context using a JSONata path.
 */
async function resolvePathValue(path: string, context: InterpolationContext): Promise<unknown> {
	const [error, result] = await tryCatch(interpolate(path, context))
	if (error) {
		logger.warn("Failed to resolve path value", { path, error: error.message })
		return undefined
	}
	return result
}

/**
 * Finds a pub where a field value matches the given value.
 */
async function findPubByFieldValue(
	communityId: CommunitiesId,
	fieldSlug: string,
	value: unknown,
	communitySlug: string
): Promise<ResolvedPub | null> {
	// We need to find the pub where the field with the given slug has the matching value
	// First, we need to find the field id by slug
	const field = await db
		.selectFrom("pub_fields")
		.select(["id", "slug"])
		.where("communityId", "=", communityId)
		.where((eb) =>
			eb.or([
				eb("slug", "=", fieldSlug),
				eb("slug", "=", `${communitySlug}:${fieldSlug}`),
				eb("slug", "like", `%:${fieldSlug}`),
			])
		)
		.executeTakeFirst()

	if (!field) {
		logger.warn("Field not found for resolver", { fieldSlug, communityId })
		return null
	}

	// Now find pubs with this field value
	const pubWithValue = await db
		.selectFrom("pub_values")
		.select("pubId")
		.where("fieldId", "=", field.id)
		.where("value", "=", JSON.stringify(value))
		.executeTakeFirst()

	if (!pubWithValue) {
		logger.debug("No pub found with matching field value", { fieldSlug, value })
		return null
	}

	// Get the full pub with related values
	const pub = await getPubsWithRelatedValues(
		{ pubId: pubWithValue.pubId, communityId },
		{
			withPubType: true,
			withRelatedPubs: true,
			withStage: false,
			withValues: true,
			depth: 3,
		}
	)

	return pub as ResolvedPub
}

/**
 * Finds a pub by its ID.
 */
async function findPubById(
	communityId: CommunitiesId,
	pubId: PubsId
): Promise<ResolvedPub | null> {
	const [error, pub] = await tryCatch(
		getPubsWithRelatedValues(
			{ pubId, communityId },
			{
				withPubType: true,
				withRelatedPubs: true,
				withStage: false,
				withValues: true,
				depth: 3,
			}
		)
	)

	if (error) {
		logger.warn("Failed to find pub by id", { pubId, error: error.message })
		return null
	}

	return pub as ResolvedPub
}

/**
 * Resolves the automation input based on a resolver expression.
 *
 * The resolver expression is a JSONata expression that can:
 * 1. Resolve a different Pub using comparisons like `$.json.some.id = $.pub.values.fieldname`
 * 2. Transform JSON input into a new structure for actions
 *
 * @param resolver - The JSONata resolver expression from the automation
 * @param context - The interpolation context containing pub, json, community, etc.
 * @param communityId - The community ID to search for pubs
 * @param communitySlug - The community slug for field lookups
 * @returns The resolved input (pub, json, or unchanged)
 */
export async function resolveAutomationInput(
	resolver: string,
	context: InterpolationContext,
	communityId: CommunitiesId,
	communitySlug: string
): Promise<ResolvedInput> {
	const parsed = parseResolverExpression(resolver)

	if (parsed.kind === "comparison") {
		// For comparison expressions, we resolve the left side and search for a pub
		// where the right side matches
		const leftValue = await resolvePathValue(parsed.leftPath, context)

		if (leftValue === undefined) {
			logger.warn("Resolver left path resolved to undefined", { path: parsed.leftPath })
			return { type: "unchanged" }
		}

		// Check if right side is a pub field value path
		const fieldSlug = extractFieldSlugFromPath(parsed.rightPath)
		if (fieldSlug) {
			const pub = await findPubByFieldValue(communityId, fieldSlug, leftValue, communitySlug)
			if (pub) {
				return { type: "pub", pub }
			}
			logger.debug("No pub found matching resolver comparison", {
				leftPath: parsed.leftPath,
				leftValue,
				fieldSlug,
			})
			return { type: "unchanged" }
		}

		// Check if right side is pub.id
		if (isPubIdPath(parsed.rightPath)) {
			// In this case, we're looking for a pub where id = leftValue
			const pub = await findPubById(communityId, leftValue as PubsId)
			if (pub) {
				return { type: "pub", pub }
			}
			return { type: "unchanged" }
		}

		// If we can't parse the right side, try evaluating as a transform
		logger.debug("Could not parse right side of comparison, treating as transform", {
			rightPath: parsed.rightPath,
		})
	}

	// For transform expressions or unknown patterns, evaluate the entire expression
	const [error, result] = await tryCatch(interpolate(resolver, context))

	if (error) {
		logger.error("Failed to evaluate resolver expression", { resolver, error: error.message })
		return { type: "unchanged" }
	}

	// If result is a pub-like object (has id, values, etc.), wrap it
	if (result && typeof result === "object" && "id" in result && "values" in result) {
		// Try to load the full pub if we just have an id
		const resolvedPub = await findPubById(communityId, (result as { id: PubsId }).id)
		if (resolvedPub) {
			return { type: "pub", pub: resolvedPub }
		}
	}

	// Otherwise, treat it as JSON
	return { type: "json", json: result as Json }
}

/**
 * Checks if an automation has a resolver configured.
 */
export function hasResolver(automation: FullAutomation): automation is FullAutomation & {
	resolver: string
} {
	return Boolean(automation.resolver && automation.resolver.trim().length > 0)
}
