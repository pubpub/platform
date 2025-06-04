import { Button } from "ui/button";
import { cn } from "utils";

import type { ButtonElement } from "../../forms/types";

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
			<div className={className}>
				<Button id="submit-button-default" type="submit" disabled={isDisabled}>
					Submit
				</Button>
			</div>
		);
	}

	return (
		<div className={cn("flex gap-2", className)}>
			{buttons.map((button) => {
				return (
					<Button id={button.id} key={button.id} type="submit" disabled={isDisabled}>
						{button.label}
					</Button>
				);
			})}
		</div>
	);
};
