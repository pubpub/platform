"use client"

import type { FieldValues, Path } from "react-hook-form"

import * as React from "react"

import { MonacoEditor } from "./MonacoEditor"
import { MonacoFormField } from "./MonacoFormField"
import type {
	JsonataContextSchema,
	MonacoEditorProps,
	MonacoFormFieldProps,
} from "./types"

// re-export core components
export { MonacoEditor } from "./MonacoEditor"
export { MonacoFormField } from "./MonacoFormField"

// re-export types
export type {
	JsonataContextSchema,
	JsonataPropertySchema,
	MonacoEditorProps,
	MonacoFormFieldProps,
	MonacoLanguage,
	MonacoTheme,
	ValidationError,
	ValidationResult,
} from "./types"

// re-export hooks
export { useMonaco, useValidation } from "./hooks"

// re-export schema utilities
export { createBasicFilterSchema, createFilterSchema } from "./schemas/filter-schema"

// specialized json editor
export type JsonEditorProps = Omit<MonacoEditorProps, "language">

export const JsonEditor = React.forwardRef<HTMLDivElement, JsonEditorProps>(
	function JsonEditor(props, ref) {
		return <MonacoEditor {...props} language="json" ref={ref} />
	}
)

// specialized jsonata editor
export type JsonataEditorProps = Omit<MonacoEditorProps, "language" | "jsonSchema"> & {
	context?: object | JsonataContextSchema
}

export const JsonataEditor = React.forwardRef<HTMLDivElement, JsonataEditorProps>(
	function JsonataEditor({ context, ...props }, ref) {
		return <MonacoEditor {...props} language="jsonata" jsonataContext={context} ref={ref} />
	}
)

// specialized form fields
export type JsonataFormFieldProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends Path<TFieldValues> = Path<TFieldValues>,
> = Omit<MonacoFormFieldProps<TFieldValues, TName>, "language" | "jsonSchema"> & {
	context?: object | JsonataContextSchema
}

export function JsonataFormField<
	TFieldValues extends FieldValues = FieldValues,
	TName extends Path<TFieldValues> = Path<TFieldValues>,
>({ context, ...props }: JsonataFormFieldProps<TFieldValues, TName>) {
	return <MonacoFormField {...props} language="jsonata" jsonataContext={context} />
}

export type JsonFormFieldProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends Path<TFieldValues> = Path<TFieldValues>,
> = Omit<MonacoFormFieldProps<TFieldValues, TName>, "language">

export function JsonFormField<
	TFieldValues extends FieldValues = FieldValues,
	TName extends Path<TFieldValues> = Path<TFieldValues>,
>(props: JsonFormFieldProps<TFieldValues, TName>) {
	return <MonacoFormField {...props} language="json" />
}
