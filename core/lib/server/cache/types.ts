import type {
	DeleteQueryBuilder,
	InsertQueryBuilder,
	SelectQueryBuilder,
	UpdateQueryBuilder,
} from "kysely";

import type { CacheTag } from "./cacheTags";
import type { MemoizeOptionType } from "./memoize";
import type Database from "~/kysely/types/Database";

/**
 * Select Query Builder
 */
export type SQB = SelectQueryBuilder<Database, keyof Database, any>;

/**
 * Mutation Query Builder
 */
export type MQB =
	| InsertQueryBuilder<Database, keyof Database, any>
	| UpdateQueryBuilder<Database, keyof Database, keyof Database, any>
	| DeleteQueryBuilder<Database, keyof Database, any>;

/**
 * Any query builder
 */
export type QB = SQB | MQB;

export type AutoCacheOptions = Omit<
	MemoizeOptionType<any[]>,
	"revalidateTags" | "additionalCacheKey"
> & {
	additionalRevalidateTags?: CacheTag[];
	additionalCacheKey?: string[];
	/**
	 * The slug of the community, in case the query
	 * is being made outside of a scoped community path
	 */
	communitySlug?: string;
};

export type AutoRevalidateOptions = {
	additionalRevalidateTags?: CacheTag[];
	additionalRevalidatePaths?: string[];

	/**
	 * The slug of the community, in case the query
	 * is being made outside of a scoped community path
	 */
	communitySlug?: string;
};

/**
 * A function (possibly async) that returns a query builder
 *
 * Has to return a query builder like `{ qb: Q }`, as Kysely annoyingly
 * patches the querybuilder to prevent it from being awaited, even
 * if it's just being returned from a function
 *
 * https://github.com/kysely-org/kysely/blob/873671b758fd70679f440057595399d73813c0cc/src/util/prevent-await.ts#L4
 */
export type QueryBuilderFunction<Q extends QB, P extends any[]> = (
	...args: P
) => { qb: Q } | Promise<{ qb: Q }>;

export type QueryBuilderFromQueryBuilderFunction<QBF extends QueryBuilderFunction<any, any>> =
	QBF extends (...args: infer P) => infer MaybePromiseQ
		? MaybePromiseQ extends Promise<{ qb: infer Q extends QB }>
			? Q
			: MaybePromiseQ extends { qb: infer Q extends QB }
				? Q
				: never
		: never;

export type ExecuteFn<
	Q extends QB,
	M extends "execute" | "executeTakeFirst" | "executeTakeFirstOrThrow",
> = () => Promise<Awaited<ReturnType<Q[M]>>>;

export type ExecuteFnFromQueryBuilderFunction<
	QBF extends QueryBuilderFunction<any, any>,
	M extends "execute" | "executeTakeFirst" | "executeTakeFirstOrThrow",
	Q extends QueryBuilderFromQueryBuilderFunction<QBF> = QueryBuilderFromQueryBuilderFunction<QBF>,
> = (...args: Parameters<QBF>) => Promise<Awaited<ReturnType<Q[M]>>>;

export type ExecuteCreatorFn<
	Q extends QB,
	M extends "execute" | "executeTakeFirst" | "executeTakeFirstOrThrow",
> = (qb: Q, method: M, options?: AutoCacheOptions) => ExecuteFn<Q, M>;

export type DirectAutoOutput<Q extends QB> = {
	qb: Q;
	execute: ExecuteFn<Q, "execute">;
	executeTakeFirst: ExecuteFn<Q, "executeTakeFirst">;
	executeTakeFirstOrThrow: ExecuteFn<Q, "executeTakeFirstOrThrow">;
};

export type CallbackAutoOutput<QBF extends QueryBuilderFunction<any, any>> = {
	getQb: QBF;
	execute: ExecuteFnFromQueryBuilderFunction<QBF, "execute">;
	executeTakeFirst: ExecuteFnFromQueryBuilderFunction<QBF, "executeTakeFirst">;
	executeTakeFirstOrThrow: ExecuteFnFromQueryBuilderFunction<QBF, "executeTakeFirstOrThrow">;
};
