import type { ButtonProps } from "ui/button";
import { Trash } from "ui/icon";

import type { PubRemoveProps } from "./RemovePubForm";
import { PathAwareDialogButton } from "../PathAwareDialogButton";
import { createPubEditorSearchParamId } from "./PubEditor/pubEditorSearchParam";

export type Props = PubRemoveProps & {
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
	className?: string;
	text?: string;
};

export const RemovePubButton = (props: Props) => {
	const pubRemoveSearchParamId = createPubEditorSearchParamId({
		method: "remove",
		identifyingString: props.pubId,
	});

	return (
		<PathAwareDialogButton
			id={pubRemoveSearchParamId}
			variant={props.variant}
			className={props.className}
		>
			<Trash size="12" className="mb-0.5" /> {props.text ?? "Remove Pub"}
		</PathAwareDialogButton>
	);
};
