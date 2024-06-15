import { revalidatePath, revalidateTag } from "next/cache";

import { logger } from "logger";

import type { autoCache } from "./autoCache";
import type {
	AutoCacheOptions,
	AutoRevalidateOptions,
	ExecuteFn,
	MQB,
	QueryBuilderFunction,
} from "./types";
import Database from "~/kysely/types/Database";
import { env } from "~/lib/env/env.mjs";
import { createCommunityCacheTags } from "./cacheTags";
import { getCommunitySlug } from "./getCommunitySlug";
import { cachedFindTables, callbackAutoOutput, directAutoOutput } from "./sharedAuto";

const executeWithRevalidate = <
	Q extends MQB<any>,
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

		const tableTags = createCommunityCacheTags(tables, communitySlug);

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
 * **🪄 autoRevalidate**
 *
 * Automatically revalidates the cache tags of a mutation query after it's executed.
 *
 * See {@link autoCache} for a more detailed explanation of the API.
 */
export function autoRevalidate<K extends keyof Database, Q extends MQB<K>>(
	qb: Q,
	options?: AutoRevalidateOptions
): {
	qb: Q;
	execute: Q["execute"];
	executeTakeFirst: Q["executeTakeFirst"];
	executeTakeFirstOrThrow: Q["executeTakeFirstOrThrow"];
};
export function autoRevalidate<P extends any[], K extends keyof Database, Q extends MQB<K>>(
	queryFn: QueryBuilderFunction<Q, P>,
	options?: AutoRevalidateOptions
): {
	getQb: (args: P[]) => Q;
	execute: Q["execute"];
	executeTakeFirst: Q["executeTakeFirst"];
	executeTakeFirstOrThrow: Q["executeTakeFirstOrThrow"];
};
export function autoRevalidate<P extends any[], K extends keyof Database, Q extends MQB<K>>(
	queryFnOrQb: Q | QueryBuilderFunction<Q, P>,
	options?: AutoRevalidateOptions
) {
	if (typeof queryFnOrQb !== "function") {
		return directAutoOutput(queryFnOrQb, executeWithRevalidate, options);
	}

	return callbackAutoOutput(queryFnOrQb, executeWithRevalidate, options);
}
