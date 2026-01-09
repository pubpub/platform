import * as z from "zod"

/**
 * regex to detect json template strings like {{ $.something }} or pure jsonata like $.something
 */
export const JSON_TEMPLATE_REGEX = /^<<<.*?>>>$|\{\{.*?\}\}/

/**
 * checks if a value is a jsonata expression by looking for <<< and >>>
 */
export const isJsonTemplate = (value: unknown): value is string => {
	return typeof value === "string" && value.startsWith("<<<") && value.endsWith(">>>")
}

// helper to check if a value needs interpolation
export const needsInterpolation = (value: string): boolean => {
	return value.includes("{{") || value.includes("$.") || value.startsWith("<<<")
}

export const wrapInJsonata = (value: string) => {
	return `<<<${value.replace(/^<*|>*$/gs, "")}>>>`
}

export const extractJsonata = (value: string) => {
	return value.replace(/^<*|>*$/gs, "")
}

/**
 * wraps a zod schema to also accept json template strings
 * handles existing modifiers like .optional(), .default(), .transform()
 */
const wrapFieldWithJsonTemplate = (fieldSchema: z.ZodTypeAny): z.ZodTypeAny => {
	let current = fieldSchema
	const modifiers: Array<{ type: string; value?: any }> = []
	let description: string | undefined

	while (current) {
		if (current._def.description) {
			description = current._def.description
		}

		if (current instanceof z.ZodOptional) {
			modifiers.push({ type: "optional" })
			current = current._def.innerType
		} else if (current instanceof z.ZodDefault) {
			modifiers.push({ type: "default", value: current._def.defaultValue })
			current = current._def.innerType
		} else if (current instanceof z.ZodNullable) {
			modifiers.push({ type: "nullable" })
			current = current._def.innerType
		} else {
			break
		}
	}

	const baseSchema = current
	const templateSchema = z.string().regex(JSON_TEMPLATE_REGEX, {
		message: "String must be a valid template with {{ }} syntax or JSONata expression",
	})

	// the order is important, bc if the other way around you would only see the error for the template schema rather than the base schema if the latter fails validation
	let wrappedSchema = z.union([baseSchema as any, templateSchema])

	// re-apply description if it existed
	if (description) {
		wrappedSchema = wrappedSchema.describe(description) as any
	}

	for (let i = modifiers.length - 1; i >= 0; i--) {
		const modifier = modifiers[i]
		if (modifier.type === "optional") {
			wrappedSchema = wrappedSchema.optional() as any
		} else if (modifier.type === "default") {
			wrappedSchema = wrappedSchema.default(
				typeof modifier.value === "function" ? modifier.value() : modifier.value
			) as any
		} else if (modifier.type === "nullable") {
			wrappedSchema = wrappedSchema.nullable() as any
		}
	}

	return wrappedSchema
}

/**
 * transforms a zod object schema to accept json template strings for all fields
 * useful for action schemas that need to support dynamic values from json-interpolate
 */
export const schemaWithJsonFields = <T extends z.ZodRawShape>(
	schema: z.ZodObject<T>
): z.ZodObject<{
	[K in keyof T]: z.ZodType<z.infer<T[K]> | string, z.ZodTypeDef, z.input<T[K]> | string>
}> => {
	const shape = schema.shape
	const newShape: any = {}

	for (const key in shape) {
		newShape[key] = wrapFieldWithJsonTemplate(shape[key])
	}

	return z.object(newShape) as any
}
