import type { Filter, FilterOperator } from "contracts";
import type { CommunitiesId } from "db/public";
import { logicalOperators } from "contracts";
import { CoreSchemaType } from "db/public";

import type { FieldsWithFilters } from "./pub-filters";
import { db } from "~/kysely/database";
import { getFieldInfoForSlugs } from "./pub";
import { coreSchemaTypeAllowedOperators, isNonRecursiveFilter } from "./pub-filters";

const isDateAt = (field: string) => field === "updatedAt" || field === "createdAt";

export class InvalidFilterError extends Error {
	constructor(
		fieldInfo: string,
		allowedOperators: FilterOperator[],
		operators: FilterOperator[]
	) {
		const incorrectOperators = new Set(operators).difference(new Set(allowedOperators));

		const message = `Operators [${Array.from(incorrectOperators).join(", ")}] are not valid for ${fieldInfo}: Only [${allowedOperators.join(", ")}] are allowed`;
		super(message);
	}
}

export class InvalidPubFieldFilterError extends InvalidFilterError {
	constructor(
		field: { schemaName: CoreSchemaType; slug: string },
		allowedOperators: FilterOperator[],
		operators: FilterOperator[]
	) {
		super(
			`schema type ${field.schemaName} of field ${field.slug}`,
			allowedOperators,
			operators
		);
	}
}

export class InvalidDateFilterError extends InvalidFilterError {
	constructor(
		field: "updatedAt" | "createdAt",
		allowedOperators: FilterOperator[],
		operators: FilterOperator[]
	) {
		super(`date field ${field}`, allowedOperators, operators);
	}
}

export async function validateFilter(communityId: CommunitiesId, filter: Filter, trx = db) {
	// find all the fields in the filter and their operators as an array

	const findFields = (
		filter: Filter,
		fieldsWithFilters: FieldsWithFilters = {}
	): FieldsWithFilters => {
		for (const [field, val] of Object.entries(filter)) {
			if (isDateAt(field)) {
				if (
					Object.keys(val).some(
						(k) =>
							!coreSchemaTypeAllowedOperators.DateTime.includes(
								k as (typeof coreSchemaTypeAllowedOperators.DateTime)[number]
							)
					)
				) {
					throw new InvalidDateFilterError(
						field,
						coreSchemaTypeAllowedOperators.DateTime,
						Object.keys(val).map((k) => k as FilterOperator)
					);
				}
				continue;
			}

			if (logicalOperators.includes(field as keyof Filter)) {
				for (const f of val) {
					findFields(f, fieldsWithFilters);
				}
				continue;
			}

			if (isNonRecursiveFilter(val)) {
				for (const [operator, value] of Object.entries(val)) {
					fieldsWithFilters[field] = fieldsWithFilters[field]
						? fieldsWithFilters[field].add(operator as FilterOperator)
						: new Set([operator as FilterOperator]);
				}
				continue;
			}

			findFields(val, fieldsWithFilters);
		}
		return fieldsWithFilters;
	};

	const foundFields = findFields(filter);
	const fields = await getFieldInfoForSlugs({
		communityId,
		slugs: Object.keys(foundFields),
		trx,
	});

	const mergedFields = fields.map((field) => {
		return {
			...field,
			operators: foundFields[field.slug],
		};
	});

	for (const field of mergedFields) {
		const allowedOperators = coreSchemaTypeAllowedOperators[field.schemaName];
		if (!field.operators.isSubsetOf(new Set(allowedOperators))) {
			throw new InvalidPubFieldFilterError(
				{ schemaName: field.schemaName, slug: field.slug },
				allowedOperators,
				Array.from(field.operators)
			);
		}
	}
}
