// ast caching layer for jsonata expressions
// jsonata(expression).ast() is expensive (~100-1000ms per call)
// this module caches parsed ASTs keyed by expression string

import type { ExprNode } from "./jsonata.overrides.js"

import jsonata from "jsonata"

const MAX_CACHE_SIZE = 256

const cache = new Map<string, ExprNode>()

export function parseExpression(expression: string): ExprNode {
	const cached = cache.get(expression)
	if (cached) {
		return cached
	}

	const ast = jsonata(expression).ast() as ExprNode

	// simple eviction: clear half the cache when it gets too large
	if (cache.size >= MAX_CACHE_SIZE) {
		const entries = Array.from(cache.keys())
		for (let i = 0; i < entries.length / 2; i++) {
			cache.delete(entries[i])
		}
	}

	cache.set(expression, ast)
	return ast
}

// exposed for testing
export function clearAstCache(): void {
	cache.clear()
}

export function getAstCacheSize(): number {
	return cache.size
}
