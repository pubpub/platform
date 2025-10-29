import type { PropsWithChildren } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { ZodObject, ZodOptional } from "zod";

import { createContext, useCallback, useContext, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Field, FieldGroup } from "ui/field";
import { Form } from "ui/form";
import { FormSubmitButton } from "ui/submit-button";

import type { Action } from "../types";
import { getDefaultValues } from "../../lib/zod";

export type ActionFormValues = FieldValues & {
	pubFields: Record<string, string[]>;
};

type ActionFormContext = {
	action: Action;
	schema: ZodOptional<ZodObject<any>>;
	form: UseFormReturn<ActionFormValues>;
	defaultFields: string[];
};

const ActionFormContext = createContext<ActionFormContext | undefined>(undefined);

type ActionFormProps = PropsWithChildren<{
	onSubmit(values: Record<string, unknown>, form: UseFormReturn<ActionFormValues>): Promise<void>;
	action: Action;
	defaultFields: string[];
	values: Record<string, unknown> | null;
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
	const form = useForm({
		resolver: zodResolver(props.action.config.schema),
		defaultValues: {
			...getDefaultValues(props.action.config.schema),
			pubFields: {},
		},
	});

	const schema = useMemo(() => {
		const schemaWithPartialDefaults = (props.action.config.schema as ZodObject<any>)
			.partial(
				props.defaultFields.reduce(
					(acc, key) => {
						acc[key] = true;
						return acc;
					},
					{} as Record<string, true>
				)
			)
			.extend({
				pubFields: z
					.record(z.string(), z.string().array())
					.optional()
					.describe("Mapping of pub fields to values"),
			})
			.optional();
		return schemaWithPartialDefaults;
	}, [props.action.config.schema, props.defaultFields]);

	const onSubmit = useCallback(
		async (data: Record<string, unknown>) => {
			await props.onSubmit(data, form);
		},
		[props.onSubmit, form]
	);

	return (
		<ActionFormContext.Provider
			value={{ action: props.action, schema, form, defaultFields: props.defaultFields }}
		>
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
		</ActionFormContext.Provider>
	);
}

export function useActionForm() {
	return useContext(ActionFormContext)!;
}
