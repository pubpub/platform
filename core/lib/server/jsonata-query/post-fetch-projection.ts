// post-fetch projection for quata
// evaluates jsonata projection expressions in-memory against fetched pubs
// uses the same pub proxy shape as all other jsonata evaluation points

import type { ProcessedPub } from "contracts"

import { interpolate } from "@pubpub/json-interpolate"

import { createPubProxy } from "~/actions/_lib/pubProxy"

// apply a jsonata projection expression to a list of fetched pubs
// each pub is wrapped in the pub proxy before evaluation, so the expression
// can use the standard pub proxy paths: values.fieldSlug, out.relSlug, etc.
export async function applyProjection<T = unknown>(
	pubs: ProcessedPub[],
	projectionExpression: string,
	communitySlug: string
): Promise<T[]> {
	const results: T[] = []

	for (const pub of pubs) {
		const proxy = createPubProxy(pub, communitySlug)
		const result = await interpolate(projectionExpression, proxy)
		results.push(result as T)
	}

	return results
}

// apply a jsonata expression to a single pub
// useful for interpolation contexts where the output is a single value
export async function evaluateOnPub<T = unknown>(
	pub: ProcessedPub,
	expression: string,
	communitySlug: string
): Promise<T> {
	const proxy = createPubProxy(pub, communitySlug)
	const result = await interpolate(expression, proxy)
	return result as T
}
