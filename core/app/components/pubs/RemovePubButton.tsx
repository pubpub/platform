import type { ButtonProps } from "ui/button"
import { Trash } from "ui/icon"

import type { PubRemoveProps } from "./RemovePubForm"
import { PathAwareDialog } from "../PathAwareDialog"
import { PubRemove } from "./RemovePubForm"

export type Props = PubRemoveProps & {
	variant?: ButtonProps["variant"]
	size?: ButtonProps["size"]
	className?: string
}

export const RemovePubButton = (props: Props) => {
	return (
		<PathAwareDialog
			id={props.pubId}
			title="Remove Pub"
			icon={<Trash size="12" className="mb-0.5" />}
			param="remove-pub-form"
			buttonText="Remove"
			buttonVariant={props.variant}
			className={props.className}
		>
			<PubRemove {...props} />
		</PathAwareDialog>
	)
}
