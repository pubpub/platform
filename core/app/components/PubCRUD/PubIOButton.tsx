import { ErrorBoundary } from "@sentry/nextjs";

import type { CommunitiesId, PubsId, StagesId } from "db/public";

import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { NewFormWrapper } from "./PubFormWrapper";
import { PubRemove } from "./PubRemove";

type CreateButtonPropsFromAllPubsPage = {
	// this occurs when the user is creating a new pub from the All Pubs Page or the Pub Page
	communityId: CommunitiesId;
	stageId?: never;
	pubId?: never;
};

type CreateButtonPropsFromStagesPage = {
	// this occurs when the user is creating a new pub from the Stages Page
	stageId: StagesId;
	communityId?: never;
	pubId?: never;
};

type EditButtonProps = {
	// this occurs when the user is editing an existing pub
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

type IOPubProps = {
	parentId?: PubsId;
	searchParams: Record<string, unknown>;
} & (CreateButtonPropsFromAllPubsPage | CreateButtonPropsFromStagesPage | EditButtonProps);

type Props = IOPubProps & {
	label?: string;
	mode: "create" | "update" | "remove";
	button?: CRUDButtonProps;
};

export const PubIOButton = (props: Props) => {
	const { label, mode, ...rest } = props;
	let identifyingString: PubsId | CommunitiesId | StagesId;
	if (mode === "update") {
		identifyingString = props.pubId!;
	} else if (mode === "create") {
		identifyingString = props.communityId ?? props.stageId!;
	} else if (mode === "remove") {
		identifyingString = props.pubId!;
		return (
			<PubCRUDDialogue
				method={"remove"}
				identifyingString={identifyingString}
				button={props.button}
			>
				<PubRemove pubId={props.pubId!} />
			</PubCRUDDialogue>
		);
	} else {
		return <ErrorBoundary>Error: Invalid mode</ErrorBoundary>;
	}

	return (
		<PubCRUDDialogue
			method={props.mode}
			identifyingString={identifyingString as string}
			button={props.label ? { title: props.label } : props.button ? props.button : undefined}
		>
			<NewFormWrapper {...rest} />
		</PubCRUDDialogue>
	);
};
