import { cn } from "utils"

import { FormLabel } from "../../form"

function AutoFormLabel({
	label,
	isRequired,
	className,
	id,
}: {
	label: string
	isRequired: boolean
	className?: string
	id?: string
}) {
	return (
		<FormLabel id={id} className={cn(className)}>
			{label}
			{isRequired && <span className="text-destructive"> *</span>}
		</FormLabel>
	)
}

export default AutoFormLabel
