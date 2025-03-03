import type { Filter, FilterOperator, LogicalOperator } from "contracts";
import type { CommunitiesId } from "db/public";
import { logicalOperators } from "contracts";
import { CoreSchemaType } from "db/public";

import { db } from "~/kysely/database";
import { getFieldInfoForSlugs } from "./pub";
import { coreSchemaTypeAllowedOperators } from "./pub-filters";

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

type FieldsWithFilters = Record<string, Set<FilterOperator>>;

/**
 * Extracts operators from a field-level condition, including those nested in logical operators
 */
const extractOperatorsFromValue = (
	value: any,
	accumulatedOperators: Set<FilterOperator> = new Set()
): Set<FilterOperator> => {
	if (typeof value !== "object" || value === null) {
		return accumulatedOperators;
	}

	const keys = Object.keys(value);
	if (keys.length > 1 || !logicalOperators.includes(keys[0] as LogicalOperator)) {
		keys.forEach((key) => {
			if (logicalOperators.includes(key as LogicalOperator)) {
				extractOperatorsFromValue({ [key]: value[key] }, accumulatedOperators);
				return;
			}

			accumulatedOperators.add(key as FilterOperator);
		});

		return accumulatedOperators;
	}

	const logicalOperator = keys[0] as LogicalOperator;
	const conditions = value[logicalOperator];

	// were done
	if (typeof conditions !== "object" || conditions === null) {
		return accumulatedOperators;
	}

	// process each condition inside the logical operator
	// add the logical operator itself
	accumulatedOperators.add(logicalOperator as FilterOperator);

	// process nested conditions
	Object.entries(conditions).forEach(([op, val]) => {
		if (logicalOperators.includes(op as LogicalOperator)) {
			// nested logical operators
			extractOperatorsFromValue({ [op]: val }, accumulatedOperators);
			return;
		}

		accumulatedOperators.add(op as FilterOperator);
	});

	return accumulatedOperators;
};

export async function validateFilter(communityId: CommunitiesId, filter: Filter, trx = db) {
	const findFields = (
		filter: Filter,
		fieldsWithFilters: FieldsWithFilters = {}
	): FieldsWithFilters => {
		for (const [field, val] of Object.entries(filter)) {
			if (logicalOperators.includes(field as any)) {
				if (Array.isArray(val)) {
					for (const f of val) {
						findFields(f, fieldsWithFilters);
					}
					continue;
				}
				if (typeof val === "object" && val !== null) {
					findFields(val, fieldsWithFilters);
				}
				continue;
			}

			if (isDateAt(field)) {
				const operators = extractOperatorsFromValue(val);

				// check if all operators are valid for DateTime
				const invalidOperators = Array.from(operators).filter(
					(op) =>
						!coreSchemaTypeAllowedOperators.DateTime.includes(op as any) &&
						!logicalOperators.includes(op as any)
				);

				if (invalidOperators.length > 0) {
					throw new InvalidDateFilterError(
						field as "updatedAt" | "createdAt",
						coreSchemaTypeAllowedOperators.DateTime,
						invalidOperators as FilterOperator[]
					);
				}
				continue;
			}

			// handle regular fields
			if (typeof val === "object" && val !== null) {
				// extract all operators, including those nested in logical operators
				const operators = extractOperatorsFromValue(val);

				// add operators to the field
				fieldsWithFilters[field] = fieldsWithFilters[field]
					? new Set([...fieldsWithFilters[field], ...operators])
					: operators;
			}
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

		// just to be sure
		const fieldOperators = new Set(
			Array.from(field.operators).filter((op) => !logicalOperators.includes(op as any))
		);

		if (!fieldOperators.isSubsetOf(new Set(allowedOperators))) {
			throw new InvalidPubFieldFilterError(
				{ schemaName: field.schemaName, slug: field.slug },
				allowedOperators,
				Array.from(fieldOperators) as FilterOperator[]
			);
		}
	}
}
