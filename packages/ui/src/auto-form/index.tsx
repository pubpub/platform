"use client";

import type { DefaultValues } from "react-hook-form";
import type { z } from "zod";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState, useWatch } from "react-hook-form";

import { cn } from "utils";

import type { Dependency, FieldConfig } from "./types";
import type { ZodObjectOrWrapped } from "./utils";
import { Button } from "../button";
import { Form } from "../form";
import AutoFormObject from "./fields/object";
import { getDefaultValues, getObjectFormSchema } from "./utils";

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
	onParsedValuesChange?: (
		values: Partial<z.infer<SchemaType>> & { pubFields: Record<string, string[]> }
	) => void;
	onSubmit?: (values: z.infer<SchemaType> & { pubFields: Record<string, string[]> }) => void;
	fieldConfig?: FieldConfig<NonNullable<z.infer<SchemaType>>>;
	children?: React.ReactNode;
	className?: string;
	dependencies?: Dependency<NonNullable<z.infer<SchemaType>>>[];
	stopPropagation?: boolean;
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

	const values = useWatch({ control: form.control });
	// valuesString is needed because useWatch() returns a new object every time
	const valuesString = JSON.stringify(values);

	function onSubmit(submittedValues: z.infer<typeof formSchema>) {
		const parsedValues = formSchema.safeParse(submittedValues);
		if (parsedValues.success) {
			onSubmitProp?.({
				...parsedValues.data,
				// need to grab this from `values` because it's not in the parsed values,
				// as pubFields are not part of the schema
				pubFields: values?.pubFields ?? {},
			});
			return;
		}

		const { issues } = parsedValues.error;
		issues.forEach((issue) => {
			form.setError(issue.path.join("."), {
				message: issue.message,
			});
		});
	}

	React.useEffect(() => {
		onValuesChangeProp?.(values);
		const parsedValues = formSchema.safeParse(values);
		if (parsedValues.success === false) {
		}
		if (parsedValues.success && parsedValues.data !== undefined) {
			onParsedValuesChange?.({ ...parsedValues.data, pubFields: values?.pubFields ?? {} });
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

export { zodToHtmlInputProps } from "./utils";

export { AutoFormObject };

export default AutoForm;
