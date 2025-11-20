"use client"

import type { DefaultValues, UseFormReturn } from "react-hook-form"
import type { z } from "zod"
import type { Dependency, FieldConfig } from "./types"
import type { ZodObjectOrWrapped } from "./utils"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFormState } from "react-hook-form"

import { cn } from "utils"

import { Form } from "../form"
import { FormSubmitButton } from "../submit-button"
import AutoFormObject from "./fields/object"
import { getDefaultValues, getObjectFormSchema } from "./utils"

export function AutoFormSubmit({
	children,
	className,
	"data-testid": testId,
	...props
}: Omit<Parameters<typeof FormSubmitButton>[0], "formState">) {
	const form = useFormState()

	return (
		<FormSubmitButton
			data-testid={testId ?? "auto-form-submit"}
			{...props}
			formState={form}
			idleText={children}
		/>
	)
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
	formSchema: SchemaType
	values?: Partial<z.infer<SchemaType>>
	onValuesChange?: (values: Partial<z.infer<SchemaType>>) => void
	onParsedValuesChange?: (
		values: Partial<z.infer<SchemaType>> & { pubFields: Record<string, string[]> }
	) => void
	onSubmit?: (
		values: z.infer<SchemaType> & { pubFields: Record<string, string[]> },
		form: UseFormReturn<any>
	) => void | Promise<void>
	fieldConfig?: FieldConfig<NonNullable<z.infer<SchemaType>>>
	children?: React.ReactNode
	className?: string
	dependencies?: Dependency<NonNullable<z.infer<SchemaType>>>[]
	stopPropagation?: boolean
}) {
	const objectFormSchema = getObjectFormSchema(formSchema)
	const defaultValues: DefaultValues<z.infer<typeof objectFormSchema>> | null =
		getDefaultValues(objectFormSchema)

	const form = useForm<z.infer<typeof objectFormSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: defaultValues ? { ...defaultValues, ...valuesProp } : undefined,
		values: valuesProp,
		reValidateMode: "onBlur",
		mode: "onBlur",
		shouldFocusError: true,
	})

	const values = form.watch()
	// valuesString is needed because form.watch() returns a new object every time
	const _valuesString = JSON.stringify(values)

	async function onSubmit(submittedValues: z.infer<typeof formSchema>) {
		const parsedValues = formSchema.safeParse(submittedValues)
		if (parsedValues.success) {
			await onSubmitProp?.(
				{
					...parsedValues.data,
					// need to grab this from `values` because it's not in the parsed values,
					// as pubFields are not part of the schema
					pubFields: values?.pubFields ?? {},
				},
				form
			)
			return
		}

		const { issues } = parsedValues.error
		issues.forEach((issue) => {
			form.setError(issue.path.join("."), {
				message: issue.message,
			})
		})
	}

	React.useEffect(() => {
		onValuesChangeProp?.(values)
		const parsedValues = formSchema.safeParse(values)
		if (parsedValues.success === false) {
		}
		if (parsedValues.success && parsedValues.data !== undefined) {
			onParsedValuesChange?.({ ...parsedValues.data, pubFields: values?.pubFields ?? {} })
		}
	}, [formSchema.safeParse, onParsedValuesChange, onValuesChangeProp, values])

	return (
		<div className="w-full">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-5", className)}>
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
	)
}

export type {
	AutoFormInputComponentProps,
	Dependency,
	EnumValues,
	FieldConfig,
	FieldConfigItem,
	OptionsDependency,
	ValueDependency,
} from "./types"

export { zodToHtmlInputProps } from "./utils"

export { AutoFormObject }

export default AutoForm
