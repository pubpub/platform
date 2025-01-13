import type * as React from "react"
import type { DefaultValues } from "react-hook-form"
import type { z } from "zod"

import type { FieldConfig } from "./types"

// TODO: This should support recursive ZodEffects but TypeScript doesn't allow circular type definitions.
type ZodObjectOrWrappedBase = z.ZodObject<any, any> | z.ZodEffects<z.ZodObject<any, any>>
type ZodObjectOrWrappedBaseOptional = z.ZodOptional<ZodObjectOrWrappedBase>
export type ZodObjectOrWrapped = ZodObjectOrWrappedBase | ZodObjectOrWrappedBaseOptional

/**
 * Beautify a camelCase string.
 * e.g. "myString" -> "My String"
 */
export function beautifyObjectName(string: string) {
	// if numbers only return the string
	let output = string.replace(/([A-Z])/g, " $1")
	output = output.charAt(0).toUpperCase() + output.slice(1)
	return output
}

/**
 * Get the lowest level Zod type.
 * This will unpack optionals, refinements, etc.
 */
export function getBaseSchema<ChildType extends z.ZodType<any> | z.AnyZodObject = z.ZodType<any>>(
	schema: ChildType | z.ZodEffects<ChildType>
): ChildType | null {
	if (!schema) {
		return null
	}
	if ("innerType" in schema._def) {
		return getBaseSchema(schema._def.innerType as ChildType)
	}
	if ("schema" in schema._def) {
		return getBaseSchema(schema._def.schema as ChildType)
	}

	return schema as ChildType
}

/**
 * Get the type name of the lowest level Zod type.
 * This will unpack optionals, refinements, etc.
 */
export function getBaseType(schema: z.ZodType<any>): string {
	const baseSchema = getBaseSchema(schema)
	return baseSchema && "typeName" in baseSchema._def ? (baseSchema._def.typeName as string) : ""
}

/**
 * Search for a "ZodDefult" in the Zod stack and return its value.
 */
export function getDefaultValueInZodStack(schema: z.ZodType<any>): any {
	const typedSchema = schema as unknown as z.ZodDefault<z.ZodNumber | z.ZodString>

	if (typedSchema._def.typeName === "ZodDefault") {
		return typedSchema._def.defaultValue()
	}

	if ("innerType" in typedSchema._def) {
		return getDefaultValueInZodStack(typedSchema._def.innerType as unknown as z.ZodType<any>)
	}
	if ("schema" in typedSchema._def) {
		return getDefaultValueInZodStack((typedSchema._def as any).schema as z.ZodType<any>)
	}

	return undefined
}

/**
 * Get all default values from a Zod schema.
 */
export function getDefaultValues<Schema extends z.ZodObject<any, any>>(
	schema: Schema,
	fieldConfig?: FieldConfig<z.infer<Schema>>
) {
	if (!schema) return null
	const { shape } = schema
	type DefaultValuesType = DefaultValues<Partial<z.infer<Schema>>>
	const defaultValues = {} as DefaultValuesType
	if (!shape) return defaultValues

	for (const key of Object.keys(shape)) {
		const item = shape[key] as z.ZodType<any>

		if (getBaseType(item) === "ZodObject") {
			const defaultItems = getDefaultValues(
				getBaseSchema(item) as unknown as z.ZodObject<any, any>,
				fieldConfig?.[key] as FieldConfig<z.infer<Schema>>
			)

			if (defaultItems !== null) {
				for (const defaultItemKey of Object.keys(defaultItems)) {
					const pathKey = `${key}.${defaultItemKey}` as keyof DefaultValuesType
					defaultValues[pathKey] = defaultItems[defaultItemKey]
				}
			}
		} else {
			let defaultValue = getDefaultValueInZodStack(item)
			if ((defaultValue === null || defaultValue === "") && fieldConfig?.[key]?.inputProps) {
				defaultValue = (fieldConfig?.[key]?.inputProps as unknown as any).defaultValue
			}
			if (defaultValue !== undefined) {
				defaultValues[key as keyof DefaultValuesType] = defaultValue
			}
		}
	}

	return defaultValues
}

export function getObjectFormSchema(schema: ZodObjectOrWrapped): z.ZodObject<any, any> {
	if (schema?._def.typeName === "ZodOptional") {
		return getObjectFormSchema(schema._def.innerType)
	}
	if (schema?._def.typeName === "ZodEffects") {
		const typedSchema = schema as z.ZodEffects<z.ZodObject<any, any>>
		return getObjectFormSchema(typedSchema._def.schema)
	}
	return schema as z.ZodObject<any, any>
}

/**
 * Convert a Zod schema to HTML input props to give direct feedback to the user.
 * Once submitted, the schema will be validated completely.
 */
export function zodToHtmlInputProps(
	schema: z.ZodNumber | z.ZodString | z.ZodOptional<z.ZodNumber | z.ZodString> | any
): React.InputHTMLAttributes<HTMLInputElement> {
	if (["ZodOptional", "ZodNullable"].includes(schema._def.typeName)) {
		const typedSchema = schema as z.ZodOptional<z.ZodNumber | z.ZodString>
		return {
			...zodToHtmlInputProps(typedSchema._def.innerType),
			required: false,
		}
	}
	const typedSchema = schema as z.ZodNumber | z.ZodString

	if (!("checks" in typedSchema._def))
		return {
			required: true,
		}

	const { checks } = typedSchema._def
	const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
		required: true,
	}
	const type = getBaseType(schema)

	for (const check of checks) {
		if (check.kind === "min") {
			if (type === "ZodString") {
				inputProps.minLength = check.value
			} else {
				inputProps.min = check.value
			}
		}
		if (check.kind === "max") {
			if (type === "ZodString") {
				inputProps.maxLength = check.value
			} else {
				inputProps.max = check.value
			}
		}
	}

	return inputProps
}
