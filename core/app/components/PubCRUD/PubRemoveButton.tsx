import type { PubRemoveProps } from "./PubRemove";
import type { CRUDButtonProps } from "./types";
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
