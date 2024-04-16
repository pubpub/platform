import Ajv from "ajv";

import { logger } from "logger";

import type { CorePubField } from "../corePubFields";

/**
 * TODO: Replace this with a more robust validation implementation
 *
 * This currently does not allow for mapping of field values to a schema
 */
export const validatePubValues = ({
	fields,
	values,
}: {
	fields: CorePubField[];
	values: Record<string, unknown>;
}) => {
	const validator = new Ajv();

	return fields.reduce(
		(acc, field) => {
			if (acc.error) {
				return acc;
			}

			const value = values[field.slug];

			if (!value) {
				return { error: `Field ${field.slug} not found in pub values` };
			}

			try {
				const val = validator.validate(field.schema.schema, value);
				if (val !== true) {
					return { error: `Field ${field.slug} failed schema validation` };
				}
				return { ...acc, [field.slug]: value };
			} catch (e) {
				logger.error(e);
				return { error: `Field ${field.slug} failed schema validation` };
			}
		},
		{} as { error: string } | Record<string, unknown>
	);
};
