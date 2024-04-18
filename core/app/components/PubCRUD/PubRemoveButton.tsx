import type { CRUDButtonProps } from "./PubCRUDDialogue";
import type { PubRemoveProps } from "./PubRemove";
import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { PubRemove } from "./PubRemove";

export const PubRemoveButton = (props: PubRemoveProps & { button?: CRUDButtonProps }) => {
	const identifyingString = props.pubId;

	return (
		<PubCRUDDialogue
			method={"remove"}
			identifyingString={identifyingString}
			button={props.button}
		>
			<PubRemove {...props} />
		</PubCRUDDialogue>
	);
};
