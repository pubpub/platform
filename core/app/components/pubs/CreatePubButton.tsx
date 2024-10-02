import type { CommunitiesId, StagesId } from "db/public";
import type { ButtonProps } from "ui/button";
import { Plus } from "ui/icon";

import type { PubEditorProps } from "./PubEditor/PubEditor";
import { PathAwareDialogButton } from "../PathAwareDialogButton";
import { createPubEditorSearchParamId } from "./PubEditor/pubEditorSearchParam";

export type Props = PubEditorProps & {
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
	className?: string;
	text?: string;
} & { stageId?: StagesId };

export const CreatePubButton = (props: Props) => {
	const id = props.stageId;

	const pubCreateSearchParamId = createPubEditorSearchParamId({
		method: "create",
		identifyingString: id,
	});

	return (
		<PathAwareDialogButton
			id={pubCreateSearchParamId}
			variant={props.variant}
			size={props.size}
			className={props.className}
		>
			<Plus size="12" className="mb-0.5" /> {props.text ?? "Create Pub"}
		</PathAwareDialogButton>
	);
};
