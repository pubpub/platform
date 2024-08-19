import type { CommunitiesId, PubsId, StagesId } from "db/public";

export type CreatePubProps = { parentId?: PubsId; searchParams?: Record<string, unknown> } & (
	| {
			communityId: CommunitiesId;
			stageId?: never;
	  }
	| {
			stageId: StagesId;
			communityId?: never;
	  }
);
