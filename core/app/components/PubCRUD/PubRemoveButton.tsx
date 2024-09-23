import type { CRUDButtonProps } from "./PubCRUDDialogue";
import type { PubRemoveProps } from "./PubRemove";
import { isModalOpen } from "~/lib/server/modal";
import { identifyingPubString } from "./identifyingPubString";
import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { PubRemove } from "./PubRemove";

export const PubRemoveButton = (props: PubRemoveProps & { button?: CRUDButtonProps }) => {
	const identifyingString = identifyingPubString({
		method: "remove",
		identifyingString: props.pubId,
	});

	const isOpen = isModalOpen(identifyingString);
	return (
		<PubCRUDDialogue
			method={"remove"}
			identifyingString={identifyingString}
			button={props.button}
		>
			{isOpen && <PubRemove {...props} />}
		</PubCRUDDialogue>
	);
};
