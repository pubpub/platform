"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { DefaultValues, useForm, useFormContext, useFormState } from "react-hook-form";
import { z } from "zod";

import { cn } from "utils";

import { Button } from "../button";
import { Form, FormMessage } from "../form";
import { Check, Loader2, X } from "../icon";
import AutoFormObject from "./fields/object";
import { Dependency, FieldConfig } from "./types";
import { getDefaultValues, getObjectFormSchema, ZodObjectOrWrapped } from "./utils";

export function AutoFormSubmit({
	children,
	className,
	disabled,
}: {
	children?: React.ReactNode;
	className?: string;
	disabled?: boolean;
}) {
	const form = useFormState();

	const { isSubmitting, isValid } = form;

	return (
		<Button
			type="submit"
			// disabled={disabled && (isSubmitting || !isValid)}
			className={className}
		>
			{children ?? "Submit"}
		</Button>
	);
}

function AutoForm<SchemaType extends ZodObjectOrWrapped>({
	formSchema,
	values: valuesProp,
	onValuesChange: onValuesChangeProp,
	onParsedValuesChange,
	onSubmit: onSubmitProp,
	fieldConfig,
	children,
	className,
	dependencies,
}: {
	formSchema: SchemaType;
	values?: Partial<z.infer<SchemaType>>;
	onValuesChange?: (values: Partial<z.infer<SchemaType>>) => void;
	onParsedValuesChange?: (values: Partial<z.infer<SchemaType>>) => void;
	onSubmit?: (values: z.infer<SchemaType>) => void;
	fieldConfig?: FieldConfig<NonNullable<z.infer<SchemaType>>>;
	children?: React.ReactNode;
	className?: string;
	dependencies?: Dependency<NonNullable<z.infer<SchemaType>>>[];
}) {
	const objectFormSchema = getObjectFormSchema(formSchema);
	const defaultValues: DefaultValues<z.infer<typeof objectFormSchema>> | null = getDefaultValues(
		objectFormSchema,
		fieldConfig
	);

	const form = useForm<z.infer<typeof objectFormSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: defaultValues ? { ...defaultValues, ...valuesProp } : undefined,
		values: valuesProp,
		reValidateMode: "onBlur",
		mode: "onBlur",
		shouldFocusError: true,
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		const parsedValues = formSchema.safeParse(values);
		if (parsedValues.success) {
			onSubmitProp?.(parsedValues.data);
			return;
		}

		const { issues } = parsedValues.error;
		issues.forEach((issue) => {
			form.setError(issue.path.join("."), {
				message: issue.message,
			});
		});
	}

	const values = form.watch();
	// valuesString is needed because form.watch() returns a new object every time
	const valuesString = JSON.stringify(values);

	React.useEffect(() => {
		onValuesChangeProp?.(values);
		const parsedValues = formSchema.safeParse(values);
		if (parsedValues.success === false) {
		}
		if (parsedValues.success && parsedValues.data !== undefined) {
			onParsedValuesChange?.(parsedValues.data);
		}
	}, [valuesString]);

	return (
		<div className="w-full">
			<Form {...form}>
				<form
					onSubmit={(e) => {
						form.handleSubmit(onSubmit)(e);
					}}
					className={cn("space-y-5", className)}
				>
					<AutoFormObject
						schema={objectFormSchema}
						form={form}
						dependencies={dependencies}
						fieldConfig={fieldConfig}
					/>

					{children}
				</form>
			</Form>
		</div>
	);
}

export type {
	AutoFormInputComponentProps,
	FieldConfig,
	FieldConfigItem,
	Dependency,
	ValueDependency,
	EnumValues,
	OptionsDependency,
} from "./types";

export { DependencyType } from "./types";

export default AutoForm;
