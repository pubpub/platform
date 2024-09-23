import type { CRUDButtonProps } from "./PubCRUDDialogue";
import type { PubUpdateProps } from "./PubUpdate";
import { isModalOpen } from "~/lib/server/modal";
import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { createPubCRUDSearchParam } from "./pubCRUDSearchParam";
import { pubCRUDSearchParamsCache } from "./pubCRUDSearchParamsServer";
import { PubUpdate } from "./PubUpdate";

export const PubUpdateButton = (props: PubUpdateProps & { button?: CRUDButtonProps }) => {
	const { pubId, button } = props;

	const identifyingString = createPubCRUDSearchParam({
		method: "update",
		identifyingString: pubId,
	});

	const isOpen = isModalOpen(identifyingString);
	return (
		<PubCRUDDialogue method={"update"} pubCRUDSearchParam={identifyingString} button={button}>
			{isOpen && <PubUpdate {...props} />}
		</PubCRUDDialogue>
	);
};
