import { ErrorBoundary } from "@sentry/nextjs";

import type { CommunitiesId, PubsId, StagesId } from "db/public";

import type { CRUDButtonProps, IOPubProps } from "./types";
import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { NewFormWrapper } from "./PubFormWrapper";
import { PubRemove } from "./PubRemove";

export type Props = IOPubProps & {
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
