import type { CommunitiesId, StagesId } from "db/public";
import type { ButtonProps } from "ui/button";
import { Plus } from "ui/icon";

import type { PubEditorProps } from "./PubEditor/PubEditor";
import { PathAwareDialog } from "../PathAwareDialog";
import { PubEditor } from "./PubEditor/PubEditor";

export type Props = PubEditorProps & {
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
	className?: string;
	text?: string;
} & ({ stageId: StagesId } | { communityId: CommunitiesId });

export const CreatePubButton = (props: Props) => {
	const id = "stageId" in props ? props.stageId : props.communityId;
	return (
		<PathAwareDialog
			buttonSize={props.size}
			buttonText={props.text ?? "Create"}
			buttonVariant={props.variant}
			className={props.className}
			icon={<Plus size="12" className="mb-0.5" />}
			id={id}
			param="create-pub-form"
			title="Create Pub"
		>
			<PubEditor {...props} />
		</PathAwareDialog>
	);
};
