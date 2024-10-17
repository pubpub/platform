"use client";

import { Button } from "ui/button";
import { cn } from "utils";

type Props = {
	form: string;
	className?: string;
	disabled?: boolean;
};

export const SaveFormButton = ({ form, className, disabled }: Props) => {
	return (
		<Button
			variant="default"
			size="lg"
			className={cn("flex gap-2 bg-emerald-500 px-4", className)}
			form={form}
			type="submit"
			data-testid="save-form-button"
			disabled={disabled}
		>
			Save
		</Button>
	);
};
