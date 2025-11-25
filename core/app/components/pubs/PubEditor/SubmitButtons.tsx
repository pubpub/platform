import type { FormElements } from "../../forms/types"

import { ElementType } from "db/public"
import { Button } from "ui/button"
import { cn } from "utils"

export const SubmitButtons = ({
	buttons,
	isDisabled,
	className,
}: {
	buttons: FormElements[]
	isDisabled?: boolean
	className?: string
}) => {
	const filteredButtons = buttons.filter((button) => button.type === ElementType.button)
	// Use a default button if the user does not have buttons configured
	if (filteredButtons.length === 0) {
		return (
			<div className={className}>
				<Button id="submit-button-default" type="submit" disabled={isDisabled}>
					Submit
				</Button>
			</div>
		)
	}

	return (
		<div className={cn("flex gap-2", className)}>
			{filteredButtons.map((button) => {
				return (
					<Button id={button.id} key={button.id} type="submit" disabled={isDisabled}>
						{button.label}
					</Button>
				)
			})}
		</div>
	)
}
