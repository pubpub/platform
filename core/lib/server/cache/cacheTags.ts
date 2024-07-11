import type { Database } from "db/Database";

export type CacheScope<K extends keyof Database = keyof Database> = "slug" | "all" | K;

export type CacheTag<S extends CacheScope = CacheScope> =
	| `community-${S}_${string}`
	| `all-${S}`
	| `all`;

/**
 * Creates a valid cache tag for a given community.
 *
 * @param key - The cache scope key.
 * @param communitySlug - The slug of the community.
 * @returns A cache tag for the specified community of the form `community-${key}_${communitySlug}`.
 */
export const createCommunityCacheTags = <S extends CacheScope>(
	key: S | S[],
	communitySlug: string
) => {
	const keys = Array.isArray(key) ? key : [key];

	return keys.map((k) => createCacheTag(`community-${k}_${communitySlug}`));
};

/** Manually create a valid typesafe cache tag */
export const createCacheTag = <T extends CacheTag>(tag: T) => tag;
