import type Database from "~/kysely/types/Database";

export type CacheScope<K extends keyof Database = keyof Database> = "slug" | "all" | K;

export type CacheTag<S extends CacheScope = CacheScope> =
	| `community-${S}_${string}`
	| `all-${S}`
	| `all`;

/**
 * Creates a valid cache tag for a given community.
 * @param key - The cache scope key.
 * @param communitySlug - The slug of the community.
 * @returns A cache tag for the specified community of
 * the form `community-${key}_${communitySlug}`.
 */
export const createCommunityCacheTag = <S extends CacheScope>(key: S, communitySlug: string) =>
	`community-${key}_${communitySlug}` satisfies CacheTag<S>;

/**
 * Manually create a valid typesafe cache tag
 */
export const createCacheTag = <T extends CacheTag>(tag: T) => tag;
