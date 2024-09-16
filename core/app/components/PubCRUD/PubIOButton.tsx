import type { CommunitiesId, PubsId, StagesId } from "db/public";

import type { CRUDButtonProps, IOPubProps } from "./types";
import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { NewFormWrapper } from "./PubFormWrapper";

export type Props = IOPubProps & {
	label?: string;
	mode: "create" | "update";
	button?: CRUDButtonProps;
};

export const PubIOButton = (props: Props) => {
	const { label, mode, ...rest } = props;
	let identifyingString: PubsId | CommunitiesId | StagesId;
	if (props.pubId) {
		identifyingString = props.pubId!;
	} else {
		identifyingString = props.communityId ?? props.stageId!;
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
