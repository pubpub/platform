import { Value } from "@sinclair/typebox/value";
import Ajv from "ajv";
import { getJsonSchemaByCoreSchemaType } from "schemas";

import { CoreSchemaType } from "db/public";
import { logger } from "logger";

import type { BasePubField } from "../../actions/corePubFields";
import { validateAgainstContextEditorSchema } from "~/lib/server/contextEditor";

/**
 * Validate all `values` against their corresponding field's `schemaName`.
 */
export const validatePubValuesBySchemaName = ({
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

/**
 * TODO: Replace this with a more robust validation implementation
 *
 * This currently does not allow for mapping of field values to a schema
 */
export const validatePubValues = ({
	fields,
	values,
}: {
	fields: BasePubField[];
	values: Record<string, unknown>;
}) => {
	const validator = new Ajv();

	for (const field of fields) {
		const value = values[field.slug];

		if (value === undefined) {
			return { error: `Field ${field.slug} not found in pub values` };
		}

		try {
			const val = validator.validate(field.schema.schema, value);
			if (val !== true) {
				return {
					error: `Field ${field.slug} failed schema validation. Field "${field.name}" of type "${field.slug}" cannot be assigned to value: ${value} of type ${typeof value}`,
				};
			}
		} catch (e) {
			logger.error(e);
			return { error: `Field ${field.slug} failed schema validation` };
		}
	}
};
