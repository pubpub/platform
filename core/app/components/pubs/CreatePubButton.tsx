import type { PubsId, StagesId } from "db/public";
import type { ButtonProps } from "ui/button";
import { Plus } from "ui/icon";

import { PathAwareDialogButton } from "../PathAwareDialogButton";
import { createPubEditorSearchParamId } from "./PubEditor/pubEditorSearchParam";

export type Props = {
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
	className?: string;
	text?: string;
} & { stageId?: StagesId; parentId?: PubsId };

export const CreatePubButton = (props: Props) => {
	const pubCreateSearchParamId = createPubEditorSearchParamId({
		method: "create",
		stageId: props.stageId,
		parentId: props.parentId,
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
