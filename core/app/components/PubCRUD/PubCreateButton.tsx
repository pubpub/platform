import type { CreateEditPubProps } from "./types";
import { NewFormWrapper } from "./NewFormWrapper";
import { PubCRUDDialogue } from "./PubCRUDDialogue";

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
