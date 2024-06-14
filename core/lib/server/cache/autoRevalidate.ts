import { revalidatePath, revalidateTag } from "next/cache";

import { logger } from "logger";

import type {
	AutoCacheOptions,
	AutoRevalidateOptions,
	ExecuteFn,
	MQB,
	QueryBuilderFunction,
} from "./types";
import { env } from "~/lib/env/env.mjs";
import { createCommunityCacheTag } from "./cacheTags";
import { getCommunitySlug } from "./getCommunitySlug";
import { cachedFindTables, callbackAutoOutput, directAutoOutput } from "./sharedAuto";

const executeWithRevalidate = <
	Q extends MQB,
	M extends "execute" | "executeTakeFirst" | "executeTakeFirstOrThrow",
>(
	qb: Q,
	method: M,
	options?: AutoRevalidateOptions
) => {
	const executeFn = async () => {
		const communitySlug = options?.communitySlug ?? getCommunitySlug();

		const compiledQuery = qb.compile();

		const tables = await cachedFindTables(compiledQuery);

		// necessary assertion here due to
		// https://github.com/microsoft/TypeScript/issues/241
		const result = await (qb[method]() as ReturnType<Q[M]>);

		const tableTags = tables.map((table) => createCommunityCacheTag(table, communitySlug));

		const tagsToRevalidate = [...tableTags, ...(options?.additionalRevalidateTags ?? [])];

		tagsToRevalidate.forEach((tag) => {
			if (env.CACHE_LOG) {
				logger.debug(`AUTOREVALIDATE: Revalidating tag: ${tag}`);
			}
			revalidateTag(tag);
		});

		if (options?.additionalRevalidatePaths) {
			options?.additionalRevalidatePaths.forEach((path) => {
				if (env.CACHE_LOG) {
					logger.debug(`AUTOREVALIDATE: Revalidating path: ${path}`);
				}
				revalidatePath(path);
			});
		}

		return result;
	};

	// we are reaching the limit of typescript's type inference here
	// without this cast, the return type of the function
	// is missing an `Awaited`
	// possibly an instance of this 10(!) year old issue, as when
	// i leave out the type in qb[method], you get ()=>any
	// https://github.com/microsoft/TypeScript/issues/241
	return executeFn as ExecuteFn<Q, M>;
};

/**
 * ***AUTO CACHE***
 *
 * Automatically caches the result of a query.
 */
export function autoRevalidate<Q extends MQB>(
	qb: Q,
	options?: AutoCacheOptions
): {
	qb: Q;
	execute: Q["execute"];
	executeTakeFirst: Q["executeTakeFirst"];
	executeTakeFirstOrThrow: Q["executeTakeFirstOrThrow"];
};
export function autoRevalidate<P extends any[], Q extends MQB>(
	queryFn: QueryBuilderFunction<Q, P>,
	options?: AutoCacheOptions
): {
	getQb: (args: P[]) => Q;
	execute: Q["execute"];
	executeTakeFirst: Q["executeTakeFirst"];
	executeTakeFirstOrThrow: Q["executeTakeFirstOrThrow"];
};
export function autoRevalidate<P extends any[], Q extends MQB>(
	queryFnOrQb: Q | QueryBuilderFunction<Q, P>,
	options?: AutoCacheOptions
) {
	if (typeof queryFnOrQb !== "function") {
		return directAutoOutput(queryFnOrQb, executeWithRevalidate, options);
	}

	return callbackAutoOutput(queryFnOrQb, executeWithRevalidate, options);
}
