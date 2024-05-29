import type Database from "~/kysely/types/Database";
import type { CommunitiesId } from "~/kysely/types/public/Communities";

export type ValidTag<K extends keyof Database = keyof Database> = `community-${K}_${CommunitiesId}`;

export const createCacheTag = <K extends keyof Database>(
	key: K,
	communityId: CommunitiesId
): ValidTag<K> => `community-${key}_${communityId}`;
