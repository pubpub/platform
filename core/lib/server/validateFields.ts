import { Value } from "@sinclair/typebox/value";
import { baseSchema } from "context-editor/schemas";
import { getJsonSchemaByCoreSchemaType } from "schemas";

import { CoreSchemaType } from "db/public";

const validateAgainstContextEditorSchema = (value: unknown) => {
	try {
		const node = baseSchema.nodeFromJSON(value);
		node.check();
		return true;
	} catch {
		return false;
	}
};

export const validatePubValuesBySchemaName = (
	values: { slug: string; value: unknown; schemaName: CoreSchemaType }[]
) => {
	const errors: { slug: string; error: string }[] = [];
	for (const { slug, value, schemaName } of values) {
		if (schemaName === CoreSchemaType.RichText) {
			const result = validateAgainstContextEditorSchema(value);

			if (!result) {
				errors.push({
					slug,
					error: `Field ${slug} failed schema validation. Field of type "${slug}" cannot be assigned to value: ${value} of type ${typeof value}.`,
				});
			}
			continue;
		}

		const jsonSchema = getJsonSchemaByCoreSchemaType(schemaName);
		const result = Value.Check(jsonSchema, value);

		if (!result) {
			errors.push({
				slug,
				error: `Field ${slug} failed schema validation. Field of type "${slug}" cannot be assigned to value: ${value} of type ${typeof value}.`,
			});
		}
	}

	return errors;
};

/**
 * Validate all `values` against their corresponding field's `schemaName`.
 * @deprecated Use `validatePubValuesBySchemaName` instead.
 */
export const _deprecated_validatePubValuesBySchemaName = ({
	fields,
	values,
}: {
	fields: { name: string; slug: string; schemaName?: CoreSchemaType | null }[];
	values: Record<string, unknown>;
}) => {
	const errors: Record<string, string> = {};
	for (const [slug, value] of Object.entries(values)) {
		const field = fields.find((f) => f.slug === slug);
		if (!field) {
			errors[slug] = `Field ${slug} does not exist on pub.`;
			continue;
		}
		if (!field.schemaName) {
			errors[slug] = `Field ${field.slug} does not have a schemaName, cannot validate.`;
			continue;
		}

		let result = false;
		// Rich text fields are a special case where we use prosemirror to validate
		// as opposed to typebox
		if (field.schemaName === CoreSchemaType.RichText) {
			result = validateAgainstContextEditorSchema(value);
		} else {
			const jsonSchema = getJsonSchemaByCoreSchemaType(field.schemaName);
			result = Value.Check(jsonSchema, value);
		}
		if (!result) {
			errors[slug] =
				`Field ${field.slug} failed schema validation. Field "${field.name}" of type "${field.slug}" cannot be assigned to value: ${value} of type ${typeof value}.`;
		}
	}
	return errors;
};
