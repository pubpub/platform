import type { CreatePubProps } from "./PubCreate";
import { PubCreate } from "./PubCreate";
import { PubCRUDDialogue } from "./PubCRUDDialogue";

type PubCreateButtonProps = CreatePubProps & {
	label?: string;
};

export const PubCreateButton = (props: PubCreateButtonProps) => {
	const identifyingString = props.communityId ?? props.stageId;

	return (
		<PubCRUDDialogue
			method={"create"}
			identifyingString={identifyingString}
			button={props.label ? { title: props.label } : undefined}
		>
			<PubCreate {...props} />
		</PubCRUDDialogue>
	);
};
