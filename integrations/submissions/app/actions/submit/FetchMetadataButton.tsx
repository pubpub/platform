"use client";

import { useTransition } from "react";
import { useFormContext } from "react-hook-form";
import {
	Button,
	Icon,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	useFormField,
	useToast,
} from "ui";
import { cn } from "utils";
import { resolveMetadata } from "./actions";

type FetchMetadataButtonProps = {
	value?: string;
};

/**
 * A button used to load metadata using the current value of a submission form
 * field.
 */
export const FetchMetadataButton = (props: FetchMetadataButtonProps) => {
	const { toast } = useToast();
	const form = useFormContext();
	const { name: identifierName } = useFormField();
	const state = form.getFieldState(identifierName);
	const [pending, startTransition] = useTransition();
	const identifierValue = props.value ?? form.getValues()[identifierName];

	const onFetchMetadata = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		event.preventDefault();
		const fill = await resolveMetadata(identifierName, identifierValue);
		if ("error" in fill && typeof fill.error === "string") {
			toast({
				title: "Error",
				description: fill.error,
				variant: "destructive",
			});
			return;
		}
		const values = form.getValues();
		const filled = Object.keys(fill);
		if (filled.length === 0) {
			toast({
				title: "Error",
				description: `We couldn't find any information about that ${identifierName}`,
				variant: "destructive",
			});
			return;
		}
		for (const field in values) {
			// Update the form with the new values and reset old values.
			form.setValue(field, fill[field] ?? "", {
				// Mark updated fields as dirty. This re-renders the auto-fill
				// buttons but does not trigger validation.
				shouldDirty: true,
				// Do not trigger validation for fields that were not updated.
				shouldValidate: field in fill,
			});
		}
		toast({
			title: "Success",
			description: `Filled ${filled.join(", ")} using the ${identifierName}`,
		});
	};

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						className={cn("px-0 ml-2")}
						onClick={(event) => startTransition(() => onFetchMetadata(event))}
						disabled={!state.isDirty || state.invalid}
					>
						{pending ? (
							<Icon.Loader2 height={18} className="animate-spin" />
						) : (
							<Icon.Wand2 height={18} color="currentColor" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>Auto-fill submission</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
