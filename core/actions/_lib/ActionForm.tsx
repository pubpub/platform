import type { PropsWithChildren } from "react";

import { useCallback, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "ui/button";
import { Field, FieldGroup } from "ui/field";
import { Form } from "ui/form";
import { FormSubmitButton } from "ui/submit-button";

import { useActionForm } from "./ActionFormProvider";

type ActionFormProps = PropsWithChildren<{
	onSubmit(values: Record<string, unknown>, form: ReturnType<typeof useForm>): Promise<void>;
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
	const [, startTransition] = useTransition();
	const onSubmit = useCallback(
		(data: Record<string, unknown>) => {
			startTransition(async () => {
				await props.onSubmit(data, form);
			});
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
