import type { CreatePubProps } from "./PubCreate";
import { PubCreate } from "./PubCreate";
import { PubCRUDDialogue } from "./PubCRUDDialogue";

export const PubCreateButton = (props: CreatePubProps) => {
	const identifyingString = props.communityId ?? props.stageId;

	return (
		<PubCRUDDialogue method={"create"} identifyingString={identifyingString}>
			<PubCreate {...props} />
		</PubCRUDDialogue>
	);
};
