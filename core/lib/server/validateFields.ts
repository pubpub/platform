import { Value } from "@sinclair/typebox/value"
import { baseSchema } from "context-editor/schemas"
import { getJsonSchemaByCoreSchemaType } from "schemas"

import { CoreSchemaType } from "db/public"

import { htmlToProsemirrorServer, prosemirrorToHTMLServer } from "../editor/serialize-server"

const validateAgainstContextEditorSchema = (value: unknown) => {
	try {
		if (typeof value === "string") {
			const node = htmlToProsemirrorServer(value)

			node.check()
			return { success: true, value }
		}

		const node = baseSchema.nodeFromJSON(value)

		node.check()

		const html = prosemirrorToHTMLServer(node)

		return { success: true, value: html }
	} catch (e) {
		return { success: false, error: e }
	}
}

const createValidationError = (slug: string, schemaName: CoreSchemaType, value: unknown) => {
	return {
		slug,
		error: `Field "${slug}" of type "${schemaName}" failed schema validation. Field "${slug}" of type "${schemaName}" cannot be assigned to value: ${value} of type ${typeof value}.`,
	}
}

export const validatePubValuesBySchemaName = <
	T extends { slug: string; value: unknown; schemaName: CoreSchemaType }[],
>(
	values: T
) => {
	return values.reduce(
		(acc, { slug, value, schemaName, ...rest }) => {
			const stringifiedValue = JSON.stringify(value)
			const trimmedValue =
				stringifiedValue.length > 1000
					? `${stringifiedValue.slice(0, 100)}...`
					: stringifiedValue

			if (schemaName === CoreSchemaType.RichText) {
				const result = validateAgainstContextEditorSchema(value)

				if (!result.success) {
					acc.errors.push({
						slug,
						error: `Field "${slug}" of type "${schemaName}" failed schema validation. ${result.error}`,
					})
					return acc
				}

				acc.results.push({ value: result.value, slug, schemaName, ...rest })
				return acc
			}

			const jsonSchema = getJsonSchemaByCoreSchemaType(schemaName)
			const result = Value.Check(jsonSchema, value)

			if (result === false) {
				acc.errors.push(createValidationError(slug, schemaName, trimmedValue))
				return acc
			}

			acc.results.push({ value, slug, schemaName, ...rest })
			return acc
		},
		{ errors: [] as { slug: string; error: string }[], results: [] as unknown as T }
	)
}
