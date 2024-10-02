import type { PubsId } from "db/public";
import type { ButtonProps } from "ui/button";
import { Pencil } from "ui/icon";

import type { PubEditorProps } from "./PubEditor/PubEditor";
import { PathAwareDialogButton } from "../PathAwareDialogButton";
import { createPubEditorSearchParamId } from "./PubEditor/pubEditorSearchParam";

export type Props = PubEditorProps & {
	pubId: PubsId;
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
	className?: string;
};

export const UpdatePubButton = (props: Props) => {
	const identifyingString = createPubEditorSearchParamId({
		method: "update",
		pubId: props.pubId,
	});

	return (
		<PathAwareDialogButton
			className={props.className}
			id={identifyingString}
			variant={props.variant}
		>
			<Pencil size="12" className="mb-0.5" /> Update
		</PathAwareDialogButton>
	);
};
