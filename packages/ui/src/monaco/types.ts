import type { ControllerRenderProps, FieldValues, Path } from "react-hook-form"

export type MonacoLanguage = "json" | "jsonata" | "javascript" | "typescript" | "html" | "css"

export type MonacoTheme = "light" | "dark"

export type ValidationResult = {
	valid: boolean
	errors: ValidationError[]
}

export type ValidationError = {
	message: string
	line: number
	column: number
	endLine?: number
	endColumn?: number
	severity: "error" | "warning" | "info"
}

export type JsonataContextSchema = {
	type: "object"
	properties: Record<string, JsonataPropertySchema>
}

export type JsonataPropertySchema = {
	type: "string" | "number" | "boolean" | "array" | "object" | "null" | "any"
	description?: string
	properties?: Record<string, JsonataPropertySchema>
	items?: JsonataPropertySchema
}

export type MonacoEditorProps = {
	value: string
	onChange: (value: string) => void
	language?: MonacoLanguage
	theme?: MonacoTheme
	height?: string | number
	minHeight?: string | number
	className?: string
	placeholder?: string
	readOnly?: boolean
	lineNumbers?: boolean
	minimap?: boolean
	wordWrap?: boolean

	// json schema validation
	jsonSchema?: object

	// jsonata type inference
	jsonataContext?: object | JsonataContextSchema

	// validation callbacks
	onValidate?: (result: ValidationResult) => void

	// ui options
	showLanguageIndicator?: boolean
	showThemeToggle?: boolean

	// accessibility
	"aria-label"?: string
	"aria-labelledby"?: string
	"aria-describedby"?: string
}

export type MonacoFormFieldProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends Path<TFieldValues> = Path<TFieldValues>,
> = Omit<MonacoEditorProps, "value" | "onChange"> & {
	field: ControllerRenderProps<TFieldValues, TName>
	allowInvalid?: boolean
	showValidationStatus?: boolean
}
