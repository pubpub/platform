import { getModalSearchParam } from "~/lib/server/modal";
import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { parsePubCRUDSearchParam } from "./pubCRUDSearchParam";

export const PubCreateModal = () => {
	const searchParams = parsePubCRUDSearchParam();
	if (!searchParams) {
		return null;
	}

	const { method, identifyingString } = searchParams;
	return (
		<PubCRUDDialogue method={method} pubCRUDSearchParam={identifyingString}>
			{isOpen && <PubCreate {...props} />}
		</PubCRUDDialogue>
	);
};
