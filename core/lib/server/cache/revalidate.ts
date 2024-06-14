import { revalidateTag } from "next/cache";

import { logger } from "logger";

import type { CacheScope } from "./cacheTags";
import { env } from "~/lib/env/env.mjs";
import { createCommunityCacheTag } from "./cacheTags";
import { getCommunitySlug } from "./getCommunitySlug";

/**
 * Revalidates cache tags for a given community scope.
 *
 * **NOTE**: Only works when the current request is within
 * a community context, i.e. on a page or route with a
 * `communitySlug` param, like in `/c/[communitySlug]`.
 *
 * To use this outside of a community context, you can
 * pass the community slug as an option.
 *
 *
 * @param scope - The cache scope or an array of cache scopes.
 * @param communitySlug - Optionally, the slug of the community to revalidate tags for.
 *
 * @returns void
 */
export const revalidateTagForCommunity = <S extends CacheScope>(
	scope: S | S[],
	communitySlug?: string
): void => {
	const slug = communitySlug ?? getCommunitySlug();

	const scopes = Array.isArray(scope) ? scope : [scope];

	scopes.forEach((scope) => {
		const tag = createCommunityCacheTag(scope, slug);
		if (env.CACHE_LOG) {
			logger.debug(`MANUAL REVALIDATE: revalidating tag: ${tag}`);
		}
		revalidateTag(tag);
	});
};
