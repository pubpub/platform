import type { FieldLevelFilter, Filter, FilterOperator, LogicalOperator } from "contracts";
import type { CommunitiesId } from "db/public";
import { logicalOperators } from "contracts";
import { CoreSchemaType } from "db/public";

import { db } from "~/kysely/database";
import { entries } from "../mapping";
import { getFieldInfoForSlugs } from "./pub";
import {
	coreSchemaTypeAllowedOperators,
	isFieldLevelEntriedLogicalOperator,
	isTopLevelEntriedLogicalFilter,
} from "./pub-filters";

/**
 * base error class for filter validation errors
 */
export class InvalidFilterError extends Error {
	constructor(
		fieldInfo: string,
		allowedOperators: FilterOperator[],
		operators: FilterOperator[]
	) {
		const incorrectOperators = Array.from(new Set(operators)).filter(
			(op) => !allowedOperators.includes(op)
		);

		const message = `Operators [${incorrectOperators.join(", ")}] are not valid for ${fieldInfo}: Only [${allowedOperators.join(", ")}] are allowed`;
		super(message);
	}
}

/**
 * error thrown when a filter uses invalid operators for a pub field
 */
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

/**
 * error thrown when a filter uses invalid operators for a date field
 */
export class InvalidDateFilterError extends InvalidFilterError {
	constructor(
		field: "updatedAt" | "createdAt",
		allowedOperators: FilterOperator[],
		operators: FilterOperator[]
	) {
		super(`date field ${field}`, allowedOperators, operators);
	}
}

/**
 * checks if a field is a date field (updatedAt or createdAt)
 */
const isDateField = (field: string): boolean => {
	return field === "updatedAt" || field === "createdAt";
};

/**
 * extracts operators from a filter value, including those nested in logical operators
 */
const extractOperatorsFromValue = (
	value: FieldLevelFilter,
	accumulatedOperators: Set<FilterOperator> = new Set()
): Set<FilterOperator> => {
	// handle non-object values
	if (typeof value !== "object" || value === null) {
		return accumulatedOperators;
	}

	const keys = Object.keys(value);

	// if (isFieldLevelEntriedLogicalOperator(value)) {
	// 	return extractOperatorsFromValue(value[0], accumulatedOperators);
	// }

	// we are assuming logic operators are "alone"
	// if (!logicalOperators.includes(keys[0] as LogicalOperator)) {
	// 	for (const key of keys) {
	// 		if (logicalOperators.includes(key as LogicalOperator)) {
	// 			extractOperatorsFromValue({ [key]: value[key] }, accumulatedOperators);
	// 		} else {
	// 			accumulatedOperators.add(key as FilterOperator);
	// 		}
	// 	}
	// 	return accumulatedOperators;
	// }

	// const logicalOperator = keys[0] as LogicalOperator;
	// const conditions = value[logicalOperator];

	// if (typeof conditions !== "object" || conditions === null) {
	// 	return accumulatedOperators;
	// }

	// accumulatedOperators.add(logicalOperator as FilterOperator);

	for (const [op, val] of entries(value)) {
		if (logicalOperators.includes(op as LogicalOperator)) {
			if (Array.isArray(val)) {
				for (const subVal of val) {
					extractOperatorsFromValue(subVal, accumulatedOperators);
				}
			} else {
				extractOperatorsFromValue(val, accumulatedOperators);
			}
		} else {
			accumulatedOperators.add(op as FilterOperator);
		}
	}

	return accumulatedOperators;
};

/**
 * type to track fields and their associated filter operators
 */
type FieldsWithFilters = Record<string, Set<FilterOperator>>;

/**
 * recursively finds all fields and their operators in a filter
 * @param filter
 * @param fieldsWithFilters accumulator for fields and their operators
 * @returns record of field names to sets of operators
 */
const findFieldsWithOperators = (
	filter: Filter,
	fieldsWithFilters: FieldsWithFilters = {}
): FieldsWithFilters => {
	for (const condition of entries(filter)) {
		// handle logical operators
		if (isTopLevelEntriedLogicalFilter(condition)) {
			const [field, val] = condition;
			// top level logical operators, which group other pubfield filters
			if (Array.isArray(val)) {
				for (const subFilter of val) {
					findFieldsWithOperators(subFilter, fieldsWithFilters);
				}
				// "pubfield level" logical operator, eg { [slug]: { $or: { $eq: "Test", $contains: "test" }}}
			} else if (typeof val === "object" && val !== null) {
				findFieldsWithOperators(val, fieldsWithFilters);
			}
			continue;
		}

		// handle updatedAt and createdAt fields
		const [field, val] = condition;
		if (isDateField(field)) {
			const operators = extractOperatorsFromValue(val);

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

		if (typeof val !== "object" || val === null) {
			continue;
		}
		// handle regular fields
		const operators = extractOperatorsFromValue(val);

		fieldsWithFilters[field] = fieldsWithFilters[field]
			? new Set([...fieldsWithFilters[field], ...operators])
			: operators;
	}

	return fieldsWithFilters;
};

/**
 * validates that a filter uses only allowed operators for each PubFiel
 * @param communityId
 * @param filter the filter to validate
 * @param trx optional transaction
 *
 * @throws {InvalidFilterError}
 * @throws {InvalidDateFilterError}
 * @throws {InvalidPubFieldFilterError}
 */
export async function validateFilter(
	communityId: CommunitiesId,
	filter: Filter,
	trx = db
): Promise<void> {
	const fieldsWithOperators = findFieldsWithOperators(filter);

	if (Object.keys(fieldsWithOperators).length === 0) {
		return;
	}

	const fieldInfos = await getFieldInfoForSlugs({
		communityId,
		slugs: Object.keys(fieldsWithOperators),
		trx,
	});

	const fieldsWithSchemaAndOperators = fieldInfos.map((field) => ({
		...field,
		operators: fieldsWithOperators[field.slug],
	}));

	for (const field of fieldsWithSchemaAndOperators) {
		const allowedOperators = coreSchemaTypeAllowedOperators[field.schemaName];

		const fieldOperators = Array.from(field.operators).filter(
			(op) => !logicalOperators.includes(op as any)
		);

		const invalidOperators = fieldOperators.filter(
			(op) => !allowedOperators.includes(op as any)
		);

		if (invalidOperators.length > 0) {
			throw new InvalidPubFieldFilterError(
				{ schemaName: field.schemaName, slug: field.slug },
				allowedOperators,
				invalidOperators as FilterOperator[]
			);
		}
	}
}
