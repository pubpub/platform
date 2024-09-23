import type { CreatePubProps } from "./PubCreate";
import { isModalOpen } from "~/lib/server/modal";
import { PubCreate } from "./PubCreate";
import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { createPubCRUDSearchParam } from "./pubCRUDSearchParam";

type PubCreateButtonProps = CreatePubProps & {
	label?: string;
};

export const PubCreateButton = (props: PubCreateButtonProps) => {
	const identifyingString = createPubCRUDSearchParam({
		method: "create",
		identifyingString: props.communityId ?? props.stageId,
	});

	const isOpen = isModalOpen(identifyingString);
	return (
		<PubCRUDDialogue
			method={"create"}
			pubCRUDSearchParam={identifyingString}
			button={props.label ? { title: props.label } : undefined}
		>
			{isOpen && <PubCreate {...props} />}
		</PubCRUDDialogue>
	);
};
