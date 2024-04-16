import * as React from "react";

import { cn } from "utils";

import { FormLabel } from "../../form";

function AutoFormLabel({
	label,
	isRequired,
	className,
}: {
	label: string;
	isRequired: boolean;
	className?: string;
}) {
	return (
		<>
			<FormLabel className={cn(className)}>
				{label}
				{isRequired && <span className="text-destructive"> *</span>}
			</FormLabel>
		</>
	);
}

export default AutoFormLabel;
