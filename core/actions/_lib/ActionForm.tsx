import { zodResolver } from "@hookform/resolvers/zod";
import type { PubsId } from "db/public";
import type { PropsWithChildren } from "react";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import { Button } from "ui/button";
import { Field, FieldGroup } from "ui/field";
import { Form } from "ui/form";
import { FormSubmitButton } from "ui/submit-button";
import { toast } from "ui/use-toast";
import type { ZodObject, ZodOptional } from "zod";

import type { Action } from "../types";
import { ActionConfigBuilder } from "./ActionConfigBuilder";

export type ActionFormContextContextValue =
	| "run"
	| "configure"
	| "automation"
	| "default";
export type ActionFormContextContext =
	| {
			type: "run";
			pubId: PubsId;
	  }
	| {
			type: Exclude<ActionFormContextContextValue, "run">;
			pubId?: never;
	  };

type ActionFormContext = {
	action: Action;
	schema: ZodOptional<ZodObject<any>> | ZodObject<any>;
	form: UseFormReturn<FieldValues>;
	defaultFields: string[];
	context: ActionFormContextContext;
	/* when rendering a nested form, the path is the path to the form */
	path?: string;
};

type ActionFormProps = PropsWithChildren<{
	action: Action;
	values: Record<string, unknown> | null;
	/* when rendering a nested form, the path is the path to the form */
	path?: string;
	defaultFields: string[];

	context: ActionFormContextContext;

	onSubmit(
		values: Record<string, unknown>,
		form: UseFormReturn<FieldValues>,
	): Promise<void>;

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

export const ActionFormContext = createContext<ActionFormContext | undefined>(
	undefined,
);

export function ActionForm(props: ActionFormProps) {
	const schema = useMemo(() => {
		const s = new ActionConfigBuilder(props.action.name)
			.withConfig(props.action.config.schema)
			.withDefaults(props.defaultFields);

		return s.getSchema();
	}, [props.action.config.schema, props.action.name, props.defaultFields]);

	const defaultValues = useMemo(() => {
		const result = schema.partial().safeParse(props.values);
		if (result.success) {
			return result.data;
		}

		toast({
			title: "Invalid initial values",
			description: `Can't parse values ${JSON.stringify(props.values)}: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n")}. This is likely an issue on our end, please report this.`,
			variant: "destructive",
		});
		return undefined;
	}, [schema, props.values]);

	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues,
	});

	const onSubmit = useCallback(
		async (data: Record<string, unknown>) => {
			await props.onSubmit(data, form);
		},
		[props.onSubmit, form],
	);

	return (
		<ActionFormContext.Provider
			value={{
				action: props.action,
				schema,
				form,
				defaultFields: props.defaultFields,
				context: props.context,
			}}
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
