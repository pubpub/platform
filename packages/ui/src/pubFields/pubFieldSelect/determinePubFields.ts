import type { z } from "zod";

import { CoreSchemaType, zodTypeToCoreSchemaType } from "schemas";

import type { FieldConfigItem } from "../../auto-form/types";
import type { PubFieldContext } from "../PubFieldContext";

export const getAllowedSchemaNames = (allowedSchemasOrZodItem: AllowedSchemasOrZodItem) => {
	if (allowedSchemasOrZodItem.zodItem) {
		const res = zodTypeToCoreSchemaType(allowedSchemasOrZodItem.zodItem);

		if (res == null) {
			return [];
		}

		return [res];
	}
	const allowedSchemas = allowedSchemasOrZodItem.allowedSchemas;

	if (!allowedSchemas) {
		return [];
	}

	if (allowedSchemas?.length === 0) {
		return [];
	}
	// just to make sure
	return allowedSchemas.filter((schema) => Boolean(CoreSchemaType[schema]));
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
