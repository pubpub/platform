import { cache } from "react";

import type { autoRevalidate } from "./autoRevalidate";
import type { AutoCacheOptions, AutoOptions, DirectAutoOutput, ExecuteFn, SQB } from "./types";
import { createCacheTag, createCommunityCacheTags } from "./cacheTags";
import { getCommunitySlug } from "./getCommunitySlug";
import { memoize } from "./memoize";
import { cachedFindTables, directAutoOutput } from "./sharedAuto";
import { getTablesWithLinkedTables } from "./specialTables";

const executeWithCache = <
	Q extends SQB<any>,
	M extends "execute" | "executeTakeFirst" | "executeTakeFirstOrThrow",
>(
	qb: Q,
	method: M,
	options?: AutoCacheOptions
) => {
	const executeFn = cache(async (...args: Parameters<Q[M]>) => {
		const communitySlug = options?.communitySlug ?? (await getCommunitySlug());

		const compiledQuery = qb.compile();

		const tables = await cachedFindTables(compiledQuery, "select");

		const allTables = getTablesWithLinkedTables(tables);

		const cachedExecute = memoize(
			async <M extends "execute" | "executeTakeFirst" | "executeTakeFirstOrThrow">(
				method: M
			) => {
				// TODO: possible improvement: just execute the compiled query rather than calling the method again
				// saves one compile cycle
				// necessary assertion here due to
				// https://github.com/microsoft/TypeScript/issues/241
				return qb[method](...args) as ReturnType<Q[M]>;
			},
			{
				...options,
				revalidateTags: [
					...createCommunityCacheTags(allTables, communitySlug),
					createCacheTag(`community-all_${communitySlug}`),
					...(options?.additionalRevalidateTags ?? []),
				],
				additionalCacheKey: [
					...(compiledQuery.parameters as string[]),
					...(options?.additionalCacheKey ?? []),
					communitySlug,
					// very important, this is really then only thing
					// that uniquely identifies the query
					compiledQuery.sql,
				],
			}
		);

		const result = await cachedExecute(method);

		return result;
	});

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
 * Automagically caches and properly tags the result of a `kysely` query, scoped to a community!
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
 * **⚠️ WARNING**
 *
 * Only works in a `communitySlug` context. If you are not in a community context, so when calling this
 * from a requests originating from `/c/[communitySlug]` or `/api/v0/c/[communitySlug]`.
 *
 * If you are calling `autoCache` from outside such a context, you WILL NEED to pass the `communitySlug`
 * option to `autoCache` to make sure the cache is tagged properly.
 *
 * `autoCache` automatically retrieves the communitySlug from a header/cookie using {@link getCommunitySlug},
 * which in turn uses the `communitySlug` cookie set by middleware, which only works when in a `communitySlug` context.
 *
 * **Usage**
 *
 * _Direct usage_
 *
 * The most obvious useage is simply immediately passing the query you want to cache to `autoCache`.
 *
 * ```ts
 * const getUsersWithMemberships = autoCache(
 * 	db.selectFrom("users").select((eb) => [
 * 		"id",
 * 		"firstName",
 * 		"lastName",
 * 		"avatar",
 * 		jsonObjectAgg(
 * 			eb.selectFrom("community_memberships").selectAll("community_memberships").whereRef("community_memberships.user_id", "=", "users.id")
 * 		)
 * 			.where("community_memberships.communityId", "=", communityId)
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
 * This will cache the query _and_ tag it properly!
 *
 * The tagging strategy is very simple: it tags every table mentioned in the query with the
 * community slug.
 *
 * For the query above, it tag the result with `community-users_${communitySlug}`,
 * `community-members_${communitySlug}`, `community-all-${communitySlug}`, and `all`.
 *
 * This works with almost any query, even recursive ones or CTEs.
 *
 * *Modifying the query*
 *
 * As mentioned above, the query builder is available on the `qb` property of the result object, so
 * you could do something like this:
 *
 * ```ts
 * const getAllUsers = autoCache(db.selectFrom("users").selectAll());
 *
 * const firstUserWithMembership = autoCache(
 * 	getAllUsers.qb.clearSelect().select((eb) => [
 * 		"id",
 *
 * 		"firstName",
 * 		"lastName",
 * 		"avatar",
 * 		jsonObjectAgg(
 * 			eb.selectFrom("community_memberships").selectAll("community_memberships").whereRef("community_memberships.user_id", "=", "users.id")
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
 *
 * **How it works**
 *
 * Roughly, `autoCache` works by
 *
 * 1. Compiling the query to get the SQL and the parameters
 * 2. Finding all tables mentioned in the query
 * 3. Creating a cache key from the SQL, the parameters, and the tables
 * 4. Tagging the cache with the community slug and the tables
 * 5. Caching the result using {@link memoize}
 */
export function autoCache<Q extends SQB<any>>(
	qb: Q,
	options?: AutoCacheOptions // this kind of short-circuits typescripts type inference, while it's kind of lying as it doesn't really have anything to do what happens in the function, it's a lot faster
): DirectAutoOutput<Q> {
	return directAutoOutput(qb, executeWithCache, options);
}
