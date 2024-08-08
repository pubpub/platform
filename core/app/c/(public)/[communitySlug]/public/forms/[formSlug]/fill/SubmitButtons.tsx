import { Button } from "ui/button";
import { cn } from "utils";

import type { ButtonElement } from "~/app/components/FormBuilder/types";

export const SubmitButtons = ({
	buttons,
	isDisabled,
	className,
}: {
	buttons: ButtonElement[];
	isDisabled?: boolean;
	className?: string;
}) => {
	// Use a default button if the user does not have buttons configured
	if (buttons.length === 0) {
		return (
			<Button
				id="submit-button-default"
				type="submit"
				disabled={isDisabled}
				className={className}
			>
				Submit
			</Button>
		);
	}
	return (
		<div className={cn("flex gap-2", className)}>
			{buttons.map((button) => {
				return (
					<Button
						id={button.elementId}
						key={button.elementId}
						type="submit"
						disabled={isDisabled}
					>
						{button.label}
					</Button>
				);
			})}
		</div>
	);
};
