import type { PropsWithChildren } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useCallback } from "react";

import { Button } from "ui/button";
import { Field, FieldGroup } from "ui/field";
import { Form } from "ui/form";
import { FormSubmitButton } from "ui/submit-button";

import type { ActionFormValues } from "./ActionFormProvider";
import { useActionForm } from "./ActionFormProvider";

type ActionFormProps = PropsWithChildren<{
	onSubmit(values: Record<string, unknown>, form: UseFormReturn<ActionFormValues>): Promise<void>;
	submitButton: {
		text: string;
		pendingText?: string;
		successText?: string;
		errorText?: string;
		className?: string;
	};
	secondaryButton?: {
		text?: string;
		className?: string;
		onClick: () => void;
	};
}>;

export function ActionForm(props: ActionFormProps) {
	const { form } = useActionForm();
	const onSubmit = useCallback(
		async (data: Record<string, unknown>) => {
			await props.onSubmit(data, form);
		},
		[props.onSubmit, form]
	);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<FieldGroup>
					{props.children}
					<Field orientation="horizontal" className="flex justify-end">
						{props.secondaryButton && (
							<Button
								variant="outline"
								type="button"
								className={props.secondaryButton?.className}
								onClick={props.secondaryButton.onClick}
							>
								{props.secondaryButton?.text}
							</Button>
						)}

						<FormSubmitButton
							data-testid="action-run-button"
							formState={form.formState}
							className={props.submitButton.className}
							idleText={props.submitButton.text}
							pendingText={props.submitButton.pendingText}
							successText={props.submitButton.successText}
							errorText={props.submitButton.errorText}
						/>
					</Field>
				</FieldGroup>
			</form>
		</Form>
	);
}
