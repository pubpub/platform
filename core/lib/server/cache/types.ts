import type {
	DeleteQueryBuilder,
	InsertQueryBuilder,
	SelectQueryBuilder,
	UpdateQueryBuilder,
} from "kysely";

import type Database from "db/Database";

import type { CacheTag } from "./cacheTags";
import type { MemoizeOptionType } from "./memoize";

/** Select Query Builder */
export type SQB<K extends keyof Database = keyof Database> = SelectQueryBuilder<Database, K, any>;

/** Mutation Query Builder */
export type MQB<K extends keyof Database = keyof Database> =
	| InsertQueryBuilder<Database, K, any>
	| UpdateQueryBuilder<Database, K, K, any>
	| DeleteQueryBuilder<Database, K, any>;

/** Any query builder */
export type QB<K extends keyof Database = keyof Database> = SQB<K> | MQB<K>;

export type AutoCacheOptions = Omit<
	MemoizeOptionType<any[]>,
	"revalidateTags" | "additionalCacheKey"
> & {
	additionalRevalidateTags?: CacheTag[];
	additionalCacheKey?: string[];
	/** The slug of the community, in case the query is being made outside of a scoped community path */
	communitySlug?: string;
};

export type AutoRevalidateOptions = {
	additionalRevalidateTags?: CacheTag[];
	additionalRevalidatePaths?: string[];
	/** The slug(s) of the community(ies), in case the query is being made outside of a scoped community path */
	communitySlug?: string | string[];
};

export type AutoOptions<Q extends QB<any>> =
	Q extends MQB<any> ? AutoRevalidateOptions : AutoCacheOptions;

export type ExecuteFn<
	Q extends QB<any>,
	M extends "execute" | "executeTakeFirst" | "executeTakeFirstOrThrow",
> = (...args: Parameters<Q[M]>) => Promise<Awaited<ReturnType<Q[M]>>>;

export type ExecuteCreatorFn<
	Q extends QB<any>,
	M extends "execute" | "executeTakeFirst" | "executeTakeFirstOrThrow",
	O extends AutoOptions<Q> = AutoOptions<Q>,
> = (qb: Q, method: M, options?: O) => ExecuteFn<Q, M>;

export type DirectAutoOutput<Q extends QB<any>> = {
	qb: Q;
	execute: ExecuteFn<Q, "execute">;
	executeTakeFirst: ExecuteFn<Q, "executeTakeFirst">;
	executeTakeFirstOrThrow: ExecuteFn<Q, "executeTakeFirstOrThrow">;
};
