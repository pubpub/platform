import type { CRUDButtonProps } from "./PubCRUDDialogue";
import type { PubUpdateProps } from "./PubUpdate";
import { GenericDynamicPubFormWrapper } from "./NewFormWrapper";
import { PubCRUDDialogue } from "./PubCRUDDialogue";

export const PubUpdateButton = (props: PubUpdateProps & { button?: CRUDButtonProps }) => {
	const { pubId, button } = props;

	const identifyingString = pubId;

	return (
		<PubCRUDDialogue method={"update"} identifyingString={identifyingString} button={button}>
			<GenericDynamicPubFormWrapper pubId={pubId} />
		</PubCRUDDialogue>
	);
};
