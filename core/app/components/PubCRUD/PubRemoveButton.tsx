import type { CRUDButtonProps } from "./PubCRUDDialogue";
import type { PubRemoveProps } from "./PubRemove";
import { isModalOpen } from "~/lib/server/modal";
import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { createPubCRUDSearchParam } from "./pubCRUDSearchParam";
import { PubRemove } from "./PubRemove";

export const PubRemoveButton = (props: PubRemoveProps & { button?: CRUDButtonProps }) => {
	const identifyingString = createPubCRUDSearchParam({
		method: "remove",
		identifyingString: props.pubId,
	});

	const isOpen = isModalOpen(identifyingString);
	return (
		<PubCRUDDialogue
			method={"remove"}
			pubCRUDSearchParam={identifyingString}
			button={props.button}
		>
			{isOpen && <PubRemove {...props} />}
		</PubCRUDDialogue>
	);
};
