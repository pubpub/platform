import type { PubsId } from "db/public";

import type { CRUDButtonProps } from "./NewFormButton";
import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { NewFormWrapper } from "./PubFormWrapper";

type PubUpdateProps = {
	pubId: PubsId;
};
export const PubUpdateButton = (props: PubUpdateProps & { button?: CRUDButtonProps }) => {
	const { pubId, button } = props;
	const identifyingString = pubId;
	return (
		<PubCRUDDialogue method={"update"} identifyingString={identifyingString} button={button}>
			<NewFormWrapper pubId={pubId} searchParams={{}} />
		</PubCRUDDialogue>
	);
};
