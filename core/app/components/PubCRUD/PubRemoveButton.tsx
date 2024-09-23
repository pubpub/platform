import type { CRUDButtonProps } from "./PubCRUDDialogue";
import type { PubRemoveProps } from "./PubRemove";
import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { pubCRUDSearchParamsCache } from "./pubCRUDSearchParamsServer";
import { PubRemove } from "./PubRemove";

export const PubRemoveButton = (props: PubRemoveProps & { button?: CRUDButtonProps }) => {
	const identifyingString = props.pubId;

	const value = pubCRUDSearchParamsCache.get(`update-pub-form`);
	const isOpen = value === identifyingString;
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
