import type { CoreSchemaType } from "db/src/public/CoreSchemaType";

/**
 * Merges an array of slugs and values with an array of fields by matching on slug.
 *
 * Filters out any slugs that don't have a matching field.
 * Returns an array of objects containing the original slug and value.
 * @param slugs Array of objects with slug and value properties
 * @param fields Array of objects with slug and schemaName properties
 * @returns Array of merged objects with slug and value properties
 */
export const mergeValuesWithFields = <
	T extends { slug: string },
	P extends { slug: string; schemaName: CoreSchemaType },
>(
	slugs: T[],
	fields: P[]
) => {
	const fieldMap = new Map<string, P>(fields.map((field) => [field.slug, field]));

	return slugs
		.map((s) => {
			const field = fieldMap.get(s.slug);

			if (!field) {
				return null;
			}

			return {
				...field,
				...s,
			};
		})
		.filter((s) => s !== null);
};
