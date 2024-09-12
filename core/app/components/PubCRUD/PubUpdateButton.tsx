import type { CRUDButtonProps } from "./PubCRUDDialogue";
import type { PubUpdateProps } from "./PubUpdate";
import { NewFormWrapper } from "./NewFormWrapper";
import { PubCRUDDialogue } from "./PubCRUDDialogue";

export const PubUpdateButton = (props: PubUpdateProps & { button?: CRUDButtonProps }) => {
	const { pubId, button } = props;

	const identifyingString = pubId;

	return (
		<PubCRUDDialogue method={"update"} identifyingString={identifyingString} button={button}>
			<NewFormWrapper pubId={pubId} searchParams={{}} />
		</PubCRUDDialogue>
	);
};
