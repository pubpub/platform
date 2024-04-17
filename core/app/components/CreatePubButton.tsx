import type { CreatePubProps } from "./CreatePub";
import { CreatePub } from "./CreatePub";
import { CRUDPubDialogue } from "./CRUDPubDialogue";

export const CreatePubButton = (props: CreatePubProps) => {
	return (
		<CRUDPubDialogue method="create">
			<CreatePub {...props} />
		</CRUDPubDialogue>
	);
};
