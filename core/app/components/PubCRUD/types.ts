import type { CommunitiesId, PubsId, StagesId } from "db/public";

type CreateButtonPropsFromAllPubsPage = {
	communityId: CommunitiesId;
	stageId?: never;
	pubId?: never;
};

type CreateButtonPropsFromStagesPage = {
	stageId: StagesId;
	communityId?: never;
	pubId?: never;
};

type EditButtonProps = {
	pubId: PubsId;
	communityId?: never;
	stageId?: never;
};

export type CRUDButtonProps = {
	title?: string | null;
	variant?: "secondary" | "outline" | "ghost" | "default" | "destructive";
	size?: "sm" | "default" | "lg" | "icon";
	className?: string;
};

export type IOPubProps = {
	parentId?: PubsId;
	searchParams: Record<string, unknown>;
} & (CreateButtonPropsFromAllPubsPage | CreateButtonPropsFromStagesPage | EditButtonProps);
