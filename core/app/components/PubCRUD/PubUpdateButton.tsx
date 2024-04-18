import type { CRUDButtonProps } from "./PubCRUDDialogue";
import type { PubUpdateProps } from "./PubUpdate";
import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { PubUpdate } from "./PubUpdate";

export const PubUpdateButton = (props: PubUpdateProps & { button?: CRUDButtonProps }) => {
	const { pubId, button } = props;

	const identifyingString = pubId;

	return (
		<PubCRUDDialogue method={"update"} identifyingString={identifyingString} button={button}>
			<PubUpdate pubId={pubId} />
		</PubCRUDDialogue>
	);
};
