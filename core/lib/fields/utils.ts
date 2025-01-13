import { CoreSchemaType } from "db/src/public/CoreSchemaType"

import { BadRequestError } from "../server/errors"

/**
 * Merges an array of slugs and values with an array of fields by matching on slug.
 *
 * Filters out any slugs that don't have a matching field.
 * Returns an array of objects containing the original slug and value.
 * @param slugs Array of objects with slug and value properties
 * @param fields Array of objects with slug and schemaName properties
 * @returns Array of merged objects with slug and value properties
 */
export const mergeSlugsWithFields = <
	T extends { slug: string },
	P extends { slug: string; schemaName: CoreSchemaType },
>(
	slugs: T[],
	fields: P[]
) => {
	const fieldMap = new Map<string, P>(fields.map((field) => [field.slug, field]))

	return slugs
		.map((s) => {
			const field = fieldMap.get(s.slug)

			if (!field) {
				return null
			}

			return {
				...field,
				...s,
			}
		})
		.filter((s) => s !== null)
}

/**
 * This should maybe go somewhere else
 */
export const hydratePubValues = <
	T extends {
		value: unknown
		schemaName: CoreSchemaType
		relatedPub?: { values: T[] } | null
	} & (
		| {
				fieldSlug: string
				slug?: never
		  }
		| {
				slug: string
				fieldSlug?: never
		  }
	),
>(
	pubValues: T[]
): T[] => {
	return pubValues.map(({ value, schemaName, relatedPub, ...rest }) => {
		const slug = rest.slug ?? rest.fieldSlug

		if (schemaName === CoreSchemaType.DateTime) {
			try {
				value = new Date(value as string)
			} catch {
				throw new BadRequestError(`Invalid date value for field ${slug}`)
			}
		}

		const hydratedRelatedPub = relatedPub
			? {
					...relatedPub,
					values: hydratePubValues(relatedPub.values),
				}
			: null

		return {
			slug,
			schemaName,
			value,
			relatedPub: hydratedRelatedPub,
			...rest,
		}
	}) as T[]
}
