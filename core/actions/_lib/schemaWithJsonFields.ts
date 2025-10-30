import * as z from "zod";

/**
 * regex to detect json template strings like {{ $.something }} or pure jsonata like $.something
 */
const JSON_TEMPLATE_REGEX = /\{\{.*?\}\}|\$\./;

/**
 * checks if a value is a json template string (contains {{ }} or jsonata expressions)
 */
export const isJsonTemplate = (value: unknown): value is string => {
	return typeof value === "string" && JSON_TEMPLATE_REGEX.test(value);
};

/**
 * wraps a zod schema to also accept json template strings
 * handles existing modifiers like .optional(), .default(), .transform()
 */
const wrapFieldWithJsonTemplate = (fieldSchema: z.ZodTypeAny): z.ZodTypeAny => {
	// unwrap to find the base type
	let current = fieldSchema;
	const modifiers: Array<{ type: string; value?: any }> = [];

	// unwrap modifiers and record them
	while (current) {
		if (current instanceof z.ZodOptional) {
			modifiers.push({ type: "optional" });
			current = current._def.innerType;
		} else if (current instanceof z.ZodDefault) {
			modifiers.push({ type: "default", value: current._def.defaultValue });
			current = current._def.innerType;
		} else if (current instanceof z.ZodNullable) {
			modifiers.push({ type: "nullable" });
			current = current._def.innerType;
		} else {
			break;
		}
	}

	// create the union that accepts either the original type or a template string
	const baseSchema = current;
	const templateSchema = z.string().regex(JSON_TEMPLATE_REGEX, {
		message: "String must be a valid template with {{ }} syntax or JSONata expression",
	});

	// create a transform that checks for template strings first
	let wrappedSchema = z.union([templateSchema, baseSchema as any]).transform((val, ctx) => {
		// if it's a template string, pass it through
		if (isJsonTemplate(val)) {
			return val;
		}
		// otherwise, use the original validation
		return val;
	});

	// re-apply modifiers in reverse order
	for (let i = modifiers.length - 1; i >= 0; i--) {
		const modifier = modifiers[i];
		if (modifier.type === "optional") {
			wrappedSchema = wrappedSchema.optional() as any;
		} else if (modifier.type === "default") {
			wrappedSchema = wrappedSchema.default(
				typeof modifier.value === "function" ? modifier.value() : modifier.value
			) as any;
		} else if (modifier.type === "nullable") {
			wrappedSchema = wrappedSchema.nullable() as any;
		}
	}

	return wrappedSchema;
};

/**
 * transforms a zod object schema to accept json template strings for all fields
 * useful for action schemas that need to support dynamic values from json-interpolate
 */
export const schemaWithJsonFields = <T extends z.ZodRawShape>(
	schema: z.ZodObject<T>
): z.ZodObject<{
	[K in keyof T]: z.ZodType<z.infer<T[K]> | string, z.ZodTypeDef, z.input<T[K]> | string>;
}> => {
	const shape = schema.shape;
	const newShape: any = {};

	for (const key in shape) {
		newShape[key] = wrapFieldWithJsonTemplate(shape[key]);
	}

	return z.object(newShape) as any;
};
