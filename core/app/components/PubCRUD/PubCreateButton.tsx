import type { CreatePubProps } from "./PubCreate";
import { isModalOpen } from "~/lib/server/modal";
import { identifyingPubString } from "./identifyingPubString";
import { PubCreate } from "./PubCreate";
import { PubCRUDDialogue } from "./PubCRUDDialogue";

type PubCreateButtonProps = CreatePubProps & {
	label?: string;
};

export const PubCreateButton = (props: PubCreateButtonProps) => {
	const identifyingString = identifyingPubString({
		method: "create",
		identifyingString: props.communityId ?? props.stageId,
	});

	const isOpen = isModalOpen(identifyingString);
	return (
		<PubCRUDDialogue
			method={"create"}
			identifyingString={identifyingString}
			button={props.label ? { title: props.label } : undefined}
		>
			{isOpen && <PubCreate {...props} />}
		</PubCRUDDialogue>
	);
};
