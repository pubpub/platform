import type { z } from "zod";

import { zodTypeToCoreSchemaType } from "schemas";

// this makes Zod be imported on the client, we might want to change this in the future
import { CoreSchemaType, coreSchemaTypeSchema } from "db/public";

import type { FieldConfigItem } from "../../auto-form/types";
import type { PubFieldContext } from "../PubFieldContext";

export const getAllowedSchemaNames = (allowedSchemasOrZodItem: AllowedSchemasOrZodItem) => {
	const allowedSchemas = allowedSchemasOrZodItem.allowedSchemas;

	if (allowedSchemas === true) {
		return Object.values(CoreSchemaType);
	}

	if (!allowedSchemas) {
		return [];
	}

	if (allowedSchemas?.length === 0) {
		return [];
	}
	if (allowedSchemasOrZodItem.zodItem) {
		const res = zodTypeToCoreSchemaType(allowedSchemasOrZodItem.zodItem);

		if (res == null) {
			return [];
		}

		return [res];
	}
	// just to make sure
	const parsed = coreSchemaTypeSchema.array().safeParse(allowedSchemas);

	if (!parsed.success) {
		throw new Error(`Invalid allowedSchemas: ${allowedSchemas.join(", ")}`);
	}

	return parsed.data;
};

export type AllowedSchemasOrZodItem =
	| {
			allowedSchemas: FieldConfigItem["allowedSchemas"];
			zodItem?: never;
	  }
	| {
			allowedSchemas?: never;
			zodItem: z.ZodType<any>;
	  }
	| {
			allowedSchemas: FieldConfigItem["allowedSchemas"];
			zodItem: z.ZodType<any>;
	  };

/**
 * Returns all pub fields that match the schema of the current field,
 * or the manually specified allowedSchemas
 */
export const determineAllowedPubFields = ({
	allPubFields,
	...allowedSchemasOrZodItem
}: {
	allPubFields: PubFieldContext;
} & AllowedSchemasOrZodItem) => {
	const allowedSchemas = getAllowedSchemaNames(allowedSchemasOrZodItem);

	return Object.values(allPubFields).filter((pubField) => {
		if (!pubField.schemaName) {
			return false;
		}
		return allowedSchemas.includes(pubField.schemaName);
	});
};
