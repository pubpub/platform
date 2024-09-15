import type { CreateEditPubProps } from "./types";
import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { NewFormWrapper } from "./PubFormWrapper";

type PubCreateButtonProps = CreateEditPubProps & {
	label?: string;
};

export const PubCreateButton = (props: PubCreateButtonProps) => {
	const identifyingString = props.communityId ?? props.stageId;
	return (
		<PubCRUDDialogue
			method={"create"}
			identifyingString={identifyingString as string}
			button={props.label ? { title: props.label } : undefined}
		>
			<NewFormWrapper {...props} />
		</PubCRUDDialogue>
	);
};
