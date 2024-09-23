import type { CreatePubProps } from "./PubCreate";
import { PubCreate } from "./PubCreate";
import { PubCRUDDialogue } from "./PubCRUDDialogue";
import { pubCRUDSearchParamsCache } from "./pubCRUDSearchParamsServer";

type PubCreateButtonProps = CreatePubProps & {
	label?: string;
};

export const PubCreateButton = (props: PubCreateButtonProps) => {
	const identifyingString = props.communityId ?? props.stageId;

	const value = pubCRUDSearchParamsCache.get(`create-pub-form`);
	const isOpen = value === identifyingString;
	return (
		<PubCRUDDialogue
			method={"create"}
			identifyingString={identifyingString}
			button={props.label ? { title: props.label } : undefined}
		>
			{isOpen && <PubCreate {...props} />}
		</PubCRUDDialogue>
	);
};
