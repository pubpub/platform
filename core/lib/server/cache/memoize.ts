// taken almost wholesale from https://github.com/alfonsusac/nextjs-better-unstable-cache

import { cache } from "react"
import { unstable_cache } from "next/cache"

import { logger } from "logger"

import type { CacheTag } from "./cacheTags"
import { env } from "~/lib/env/env.mjs"
import { ONE_YEAR } from "./constants"

type Callback<Parameters extends unknown[], ReturnType> = (
	...args: Parameters
) => ReturnType | Promise<ReturnType>

export type MemoizeOptionType<Parameters extends unknown[]> = {
	persist?: boolean
	duration?: number
	log?: ("dedupe" | "datacache" | "verbose")[]
	logid?: string
	revalidateTags?: ((...params: Parameters) => CacheTag[]) | CacheTag[]
	additionalCacheKey?: ((...params: Parameters) => string[]) | string[]
	suppressWarnings?: boolean
	/**
	 * Whether or not to wrap the function in `React.cache`
	 *
	 * Set to `false` when calling this function from a route handler, as `React.cache` is not
	 * supported there.
	 */
	reactCache?: boolean
}

/**
 * ### MEMOIZE: unstable_cache() + cache()
 *
 * A way to generalize the data caching function in Next.js
 */
export function memoize<P extends unknown[], R>(cb: Callback<P, R>, opts?: MemoizeOptionType<P>) {
	if (typeof window !== "undefined") {
		// Fallback to original function if window is defined (client side)
		if (!opts?.suppressWarnings) {
			logger.warn("⚠️ Memoize: this function will not work in the client environment.")
		}
		return async (...args: P) => {
			return cb(...args)
		}
	}
	if (typeof cache === "undefined" && typeof unstable_cache === "undefined") {
		// Fallback to the original function if there's no caching functions (ex. on react native)
		if (!opts?.suppressWarnings) {
			logger.warn(
				"⚠️ Memoize: cache or unstable_cache function not found. Falling back to original function"
			)
		}
		return async (...args: P) => {
			return cb(...args)
		}
	}

	const {
		// default values
		persist = true,
		duration = ONE_YEAR,
		log = [],
		revalidateTags: revalidateTagsFn,
		additionalCacheKey: additionalCacheKeyFn,
	} = opts ?? {}
	const logDataCache = log.includes("datacache") || env.CACHE_LOG === "true"
	const logDedupe = log.includes("dedupe") || env.CACHE_LOG === "true"
	const logVerbose = log.includes("verbose") || env.CACHE_LOG === "true"
	const logID = opts?.logid ? `${opts.logid} ` : ""

	let oldData: any
	let renderCacheHit: boolean
	renderCacheHit = false

	const cachedFn = cache(async (...args: P) => {
		renderCacheHit = true
		if (persist) {
			// Initialize unstable_cache
			const additionalCacheKey = additionalCacheKeyFn
				? typeof additionalCacheKeyFn === "function"
					? additionalCacheKeyFn(...args)
					: additionalCacheKeyFn
				: []
			const revalidateTags = revalidateTagsFn
				? typeof revalidateTagsFn === "function"
					? revalidateTagsFn(...args)
					: revalidateTagsFn
				: []
			const cacheKey = [cb.toString(), JSON.stringify(args), ...additionalCacheKey]
			const nextOpts = {
				revalidate: duration,
				tags: ["all", ...revalidateTags],
			}
			if (logDataCache) {
				let dataCacheMiss = false
				const audit = new Audit()
				const data = await unstable_cache(
					async () => {
						dataCacheMiss = true
						return cb(...args)
					},
					cacheKey,
					nextOpts
				)()
				const time = audit!.getSec()
				const isSame = oldData === data
				logger.debug(
					`Data Cache - ${logID}${cb.name} ${dataCacheMiss ? "MISS" : "HIT"} ${time.toPrecision(3)}s ${dataCacheMiss ? (isSame ? "background-revalidation" : "on-demand revalidation") : ""} `
				)
				if (logVerbose)
					logger.info(
						` └ Function: ${cb.name || "Anon Func"} | args: ${JSON.stringify(args)} | tags: ${nextOpts.tags} | cacheKey: ${cacheKey}`
					)
				oldData = data
				return data
			} else {
				const data = await unstable_cache(
					async () => {
						return cb(...args)
					},
					[cb.toString(), JSON.stringify(args), ...additionalCacheKey],
					{
						revalidate: duration,
						// we always cache "all"
						tags: ["all", ...revalidateTags],
					}
				)()
				return data
			}
		} else {
			// return callback directly
			return cb(...args)
		}
	})

	const returnFunc = async (...args: P) => {
		if (logDedupe) {
			let audit2 = new Audit()
			let data = await cachedFn(...args)
			let time = audit2.getSec()
			logger.debug(
				`Memoization - ${logID}${cb.name} ${renderCacheHit ? "HIT" : "MISS"} ${time.toPrecision(3) + "s"} `
			)
			renderCacheHit = false
			return data
		} else {
			return await cachedFn(...args)
		}
	}

	return returnFunc
}

class Audit {
	private _start: number = performance.now()
	private _end: number | null = null
	getSec() {
		this._end = performance.now()
		return (this._end - this._start) / 1000
	}
}
