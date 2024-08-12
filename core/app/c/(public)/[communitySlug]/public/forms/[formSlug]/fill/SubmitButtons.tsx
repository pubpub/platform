import { Button } from "ui/button";
import { cn } from "utils";

import type { Form } from "~/lib/server/form";
import { isButtonElement } from "~/app/components/FormBuilder/types";

export const SubmitButtons = ({
	buttons,
	isDisabled,
	className,
}: {
	buttons: Form["elements"];
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
			{buttons
				.filter((button) => isButtonElement(button))
				.map((button) => {
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
