import type {
	AutoCacheOptions,
	CallbackAutoOutput,
	DirectAutoOutput,
	ExecuteFn,
	QueryBuilderFunction,
	SQB,
} from "./types";
import { createCommunityCacheTag } from "./cacheTags";
import { getCommunitySlug } from "./getCommunitySlug";
import { memoize } from "./memoize";
import { cachedFindTables, callbackAutoOutput, directAutoOutput } from "./sharedAuto";

const executeWithCache = <
	Q extends SQB,
	M extends "execute" | "executeTakeFirst" | "executeTakeFirstOrThrow",
>(
	qb: Q,
	method: M,
	options?: AutoCacheOptions
) => {
	const executeFn = async () => {
		const communitySlug = options?.communitySlug ?? getCommunitySlug();

		const compiledQuery = qb.compile();

		const tables = await cachedFindTables(compiledQuery);

		const cachedExecute = memoize(
			async <M extends "execute" | "executeTakeFirst" | "executeTakeFirstOrThrow">(
				method: M
			) => {
				// TODO: possible improvement: just execute the compiled query rather than calling the method again
				// saves one compile cycle
				// necessary assertion here due to
				// https://github.com/microsoft/TypeScript/issues/241
				return qb[method]() as ReturnType<Q[M]>;
			},
			{
				...options,
				revalidateTags: [
					...tables.map((table) => createCommunityCacheTag(table, communitySlug)),
					...(options?.additionalRevalidateTags ?? []),
				],
				additionalCacheKey: [
					...(compiledQuery.parameters as string[]),
					...(options?.additionalCacheKey ?? []),
					// very important, this is really then only thing
					// that uniquely identifies the query
					compiledQuery.sql,
				],
			}
		);

		const result = await cachedExecute(method);

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
export function autoCache<Q extends SQB>(qb: Q, options?: AutoCacheOptions): DirectAutoOutput<Q>; // this kind of short-circuits typescripts type inference, while it's kind of lying as it doesn't really have anything to do what happens in the function, it's a lot faster
export function autoCache<QBF extends QueryBuilderFunction<any, any>>(
	queryFn: QBF,
	options?: AutoCacheOptions
): CallbackAutoOutput<QBF>;
export function autoCache<P extends any[], Q extends SQB>(
	queryFnOrQb: Q | QueryBuilderFunction<Q, P>,
	options?: AutoCacheOptions
) {
	if (typeof queryFnOrQb !== "function") {
		return directAutoOutput(queryFnOrQb, executeWithCache, options);
	}

	return callbackAutoOutput(queryFnOrQb, executeWithCache, options);
}
