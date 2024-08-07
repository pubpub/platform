import { Value } from "@sinclair/typebox/value";
import Ajv from "ajv";
import { getJsonSchemaByCoreSchemaType } from "schemas";

import type { CoreSchemaType } from "db/public";
import { logger } from "logger";

import type { BasePubField } from "../corePubFields";

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
	for (const [slug, value] of Object.entries(values)) {
		const field = fields.find((f) => f.slug === slug);
		if (!field) {
			return { error: `Field ${slug} does not exist on pub` };
		}
		if (!field.schemaName) {
			return { error: `Field ${field.slug} does not have a schemaName, cannot validate` };
		}
		const jsonSchema = getJsonSchemaByCoreSchemaType(field.schemaName);
		const result = Value.Check(jsonSchema, value);
		if (!result) {
			return {
				error: `Field ${field.slug} failed schema validation. Field "${field.name}" of type "${field.slug}" cannot be assigned to value: ${value} of type ${typeof value}`,
			};
		}
	}
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
