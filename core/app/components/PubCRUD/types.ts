import type { CommunitiesId, PubsId, StagesId } from "db/public";

export type CreateEditPubProps = {
	parentId?: PubsId;
	searchParams: Record<string, unknown>;
} & (
	| {
			communityId: CommunitiesId;
			stageId?: never;
			pubId?: never;
	  }
	| {
			stageId: StagesId;
			communityId?: never;
			pubId?: never;
	  }
	| {
			pubId: PubsId;
			communityId?: never;
			stageId?: never;
	  }
);
