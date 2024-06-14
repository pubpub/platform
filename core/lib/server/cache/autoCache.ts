import type { autoRevalidate } from "./autoRevalidate";
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
 * **✨ autoCache**
 *
 * Automagically caches and properly tags the result of a `kysely` query!
 *
 * You can either pass a complete Kysely query excluding the final execute call, or a(n async)
 * function that returns a query builder as an object `{ qb: Q }`.
 *
 * See {@link autoRevalidate} for the sibling function that automatically revalidates the cache on
 * mutations.
 *
 * **Options**
 *
 * These are in addition to the same options for {@link memoize}
 *
 * Cache key in addition to the query parameters and the query itself.
 *
 * **Usage**
 *
 * _Direct usage_
 *
 * The most obvious useage is simply immediately passing the query you want to cache to `autoCache`.
 *
 * ```ts
 * const getUsersWithMemberships = await autoCache(
 * 	db.selectFrom("users").select((eb) => [
 * 		"id",
 * 		"firstName",
 * 		"lastName",
 * 		"avatar",
 * 		jsonObjectAgg(
 * 			eb.selectFrom("members").selectAll().whereRef("members.user_id", "=", "users.id")
 * 		)
 * 			.where("community_id", "=", communityId)
 * 			.as("memberships"),
 * 	])
 * );
 * ```
 *
 * This returns an object with all the `execute` methods, as well as the querybuilder itself on the
 * `qb` property, should you want to extend or modify the query further.
 *
 * ```ts
 * const cachedResult = await getUsersWithMemberships.execute();
 * ```
 *
 * This will cache the query _and_ tag it properly.
 *
 * The tagging strategy is very simple: it tags every table mentioned in the query with the
 * community slug.
 *
 * For the query above, it tag the result with `community-users_${communitySlug}`,
 * `community-members_${communitySlug}`, `community-all-${communitySlug}`, and `all`.
 *
 * This works with almost any query, even recursive ones or CTEs.
 *
 * ### Modifying the query
 *
 * As mentioned above, the query builder is available on the `qb` property of the result object, so
 * you could do something like this:
 *
 * ```ts
 * const getAllUsers = autoCache(db.selectFrom("users").selectAll());
 *
 * const allUsers = await getAllUsers.execute();
 *
 * const firstUserWithMembership = autoCache(
 * 	getAllUsers.qb.clearSelect().select((eb) => [
 * 		"id",
 *
 * 		"firstName",
 * 		"lastName",
 * 		"avatar",
 * 		jsonObjectAgg(
 * 			eb.selectFrom("members").selectAll().whereRef("members.user_id", "=", "users.id")
 * 		)
 * 			.where("community_id", "=", "s")
 * 			.as("memberships"),
 * 	])
 * ).executeTakeFirstOrThrow();
 * ```
 *
 * **NOTE**
 *
 * Only calling the `execute` functions returned from `autoCache` will actually cache the query! The
 * `qb` property is just a reference to the querybuilder you passed in, and will not cache the query
 * if you call `execute` on it.
 *
 * As you can see above, you will need to wrap the querybuilder in `autoCache` again to cache the
 * new query.
 *
 * ## Callback usage
 *
 * You can also pass a function that returns a query builder as an object `{ qb: Q }`.
 *
 * The weird return type is necessary because `kysely` overrides the prototype of the querybuilder
 * to throw when `await`ing it, even when you are simply awaiting it as a return value! Very silly
 * `kysely`.
 *
 * The reason they do that is to make situations where you forget to call `execute` more obvious,
 * but it's a bit overkill imo.
 *
 * ```ts
 * const getCommunityMemberships = autoCache((communityId: CommunitiesId) => {
 * 	return {
 * 		qb: db.selectFrom("members").selectAll().where("community_id", "=", communityId),
 * 	};
 * });
 *
 * export default async function UserPage({ params: { communitySlug } }) {
 * 	const communityId = await findCommunityIdBySlug(communitySlug);
 *
 * 	// you provide the communityId as an argument to the execute
 * 	// function instead of doing getCommunityMemberships(communityId).execute()
 * 	// as the function returning the query builder could be async
 * 	// which means you would have to do
 * 	// await (await getCommunityMemberships)(communityId).execute()
 * 	// which is a bit cumbersome
 * 	const memberships = await getCommunityMemberships.execute(communityId);
 *
 * 	// ...
 * }
 * ```
 *
 * _Async query builder function_
 *
 * The function to be passed to `autoCache` can also be async, which is useful if you need to do
 * some async work before you can create the query.
 *
 * ```ts
 * const getCommunityMemberships = autoCache(async (communitySlug: string) => {
 * 	// everything in the body of the function will not be cached
 * 	// as we have no realy way of knowing what's going on in there
 * 	// you should cache it yourself if you need to
 * 	const communityId = await findCommunityIdBySlug(communitySlug);
 *
 * 	// other async work...
 *
 * 	return {
 * 		qb: db.selectFrom("members").selectAll().where("community_id", "=", communityId),
 * 	};
 * });
 * ```
 *
 * You use it the same way as the direct usage example above.
 *
 * ```ts
 * const memberships = await getCommunityMemberships.execute(communitySlug);
 * ```
 *
 * For both syncronous and asyncronous callback functions, you can retrieve the query builder by
 * calling the `getQb` function on the result object. It will be a synchronous or asynchronous
 * function respectively.
 *
 * Again, note that you will need to wrap the querybuilder in `autoCache` again to cache the new
 * query.
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
