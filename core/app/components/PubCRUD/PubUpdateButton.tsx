import type { CRUDButtonProps } from "./PubCRUDDialogue";
import type { PubUpdateProps } from "./PubUpdate";
import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { pubCRUDSearchParamsCache } from "./pubCRUDSearchParamsServer";
import { PubUpdate } from "./PubUpdate";

export const PubUpdateButton = (props: PubUpdateProps & { button?: CRUDButtonProps }) => {
	const { pubId, button } = props;

	const identifyingString = pubId;

	const value = pubCRUDSearchParamsCache.get(`update-pub-form`);
	const isOpen = value === identifyingString;
	return (
		<PubCRUDDialogue method={"update"} identifyingString={identifyingString} button={button}>
			{isOpen && <PubUpdate {...props} />}
		</PubCRUDDialogue>
	);
};
