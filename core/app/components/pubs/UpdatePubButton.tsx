import { PubsId } from "db/public";
import { ButtonProps } from "ui/button";
import { Pencil } from "ui/icon";

import type { PubEditorProps } from "./PubEditor/PubEditor";
import { PathAwareDialog } from "../PathAwareDialog";
import { PubEditor } from "./PubEditor/PubEditor";

export type Props = PubEditorProps & {
	pubId: PubsId;
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
	className?: string;
};

export const UpdatePubButton = (props: Props) => {
	return (
		<PathAwareDialog
			buttonSize={props.size}
			buttonText="Update"
			buttonVariant={props.variant}
			className={props.className}
			icon={<Pencil size="12" className="mb-0.5" />}
			id={props.pubId}
			param="update-pub-form"
			title="Update Pub"
		>
			<PubEditor {...props} />
		</PathAwareDialog>
	);
};
