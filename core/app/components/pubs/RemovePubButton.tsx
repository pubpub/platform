import type React from "react";

import type { ButtonProps } from "ui/button";
import { Trash } from "ui/icon";

import type { PubRemoveProps } from "./RemovePubFormClient";
import { PathAwareDialog } from "../PathAwareDialog";
import { PubRemove } from "./RemovePubForm";

export type Props = PubRemoveProps & {
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
	className?: string;
	/** Renders only the icon on the button */
	iconOnly?: boolean;
	/** Default is "Remove" */
	buttonText?: string;
	/** Default is trash icon */
	icon?: React.ReactElement;
};

export const RemovePubButton = ({
	pubId,
	variant,
	className,
	iconOnly,
	redirectTo,
	buttonText = "Remove",
	icon = <Trash size="12" className="mb-0.5" />,
}: Props) => {
	return (
		<PathAwareDialog
			id={pubId}
			title="Remove Pub"
			icon={icon}
			param="remove-pub-form"
			buttonText={buttonText}
			buttonVariant={variant}
			className={className}
			iconOnly={iconOnly}
		>
			<PubRemove pubId={pubId} redirectTo={redirectTo} />
		</PathAwareDialog>
	);
};
