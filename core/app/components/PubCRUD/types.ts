import type { CommunitiesId, PubsId, StagesId } from "db/public";

export type CreateEditPubProps = {
	pubId?: PubsId;
	parentId?: PubsId;
	searchParams?: Record<string, unknown>;
} & (
	| {
			communityId: CommunitiesId;
			stageId?: never;
	  }
	| {
			stageId: StagesId;
			communityId?: never;
	  }
);
