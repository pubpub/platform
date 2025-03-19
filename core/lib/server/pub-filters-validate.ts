import type { FieldLevelFilter, Filter, FilterOperator, LogicalOperator } from "contracts";
import type { CommunitiesId } from "db/public";

import { db } from "~/kysely/database";
import { entries } from "../mapping";
import { getFieldInfoForSlugs } from "./pub";
import { coreSchemaTypeAllowedOperators } from "./pub-filters";

/**
 * base error class for filter validation errors
 */
export class InvalidFilterError extends Error {
	constructor(
		fieldInfo: string,
		allowedOperators: Set<FilterOperator>,
		operators: Set<FilterOperator>
	) {
		const incorrectOperators = operators.difference(allowedOperators);

		if (incorrectOperators.size === 0) {
			throw new Error(
				"Something went wrong throwing an InvalidFilterError, no incorrect operators found"
			);
		}

		const message = `Operators [${Array.from(incorrectOperators).join(", ")}] are not valid for ${fieldInfo}: Only [${Array.from(allowedOperators).join(", ")}] are allowed`;
		super(message);
	}
}

const assertAllowedOperators = (
	fieldInfo: string,
	field: Set<FilterOperator>,
	allowedOperators: FilterOperator[]
): void => {
	const allowedOperatorsSet = new Set(allowedOperators);
	const hasDissallowedOperators = !field.isSubsetOf(allowedOperatorsSet);

	if (hasDissallowedOperators) {
		throw new InvalidFilterError(fieldInfo, allowedOperatorsSet, field);
	}
};

/**
 * validates that a filter uses only allowed operators for each PubFiel
 * @param communityId
 * @param filter the filter to validate
 * @param trx optional transaction
 *
 * FIXME: this function shares a lot in common with `applyFilters`, they are both walking the filter in some way
 * It would be good to use a common helper function for this
 *
 * @throws {InvalidFilterError}
 * @throws {InvalidDateFilterError}
 * @throws {InvalidPubFieldFilterError}
 */
export async function validateFilter(communityId: CommunitiesId, filter: Filter, trx = db) {
	const fieldsWithOperators = extractFilterOperators(filter);

	if (Object.keys(fieldsWithOperators).length === 0) {
		return;
	}

	const { updatedAt, createdAt, ...actualFields } = fieldsWithOperators;

	for (const [operators, field] of [
		[updatedAt, "updatedAt"],
		[createdAt, "createdAt"],
	] as const) {
		if (!operators) {
			continue;
		}

		assertAllowedOperators(field, operators, coreSchemaTypeAllowedOperators.DateTime);
	}

	const fieldInfos = await getFieldInfoForSlugs({
		communityId,
		slugs: Object.keys(actualFields),
		trx,
	});

	const fieldsWithSchemaAndOperators = fieldInfos.map((field) => ({
		...field,
		operators: fieldsWithOperators[field.slug],
	}));

	for (const field of fieldsWithSchemaAndOperators) {
		const allowedOperators = coreSchemaTypeAllowedOperators[field.schemaName];

		assertAllowedOperators(
			`${field.slug} of schema ${field.schemaName}`,
			field.operators,
			allowedOperators
		);
	}

	// just for testing
	return fieldsWithSchemaAndOperators;
}

const isLogicalOperator = (key: string): key is LogicalOperator => {
	return key === "$or" || key === "$and" || key === "$not";
};

const isFilterOperator = (key: string): key is FilterOperator => {
	return key.startsWith("$") && !isLogicalOperator(key);
};

/**
 * Extracts all operators used for each field slug in a filter
 * @param filter The filter object to analyze
 * @returns Record mapping field slugs to their used operators
 */
function extractFilterOperators(filter: Filter): Record<string, Set<FilterOperator>> {
	const result: Record<string, Set<FilterOperator>> = {};

	function addOperator(slug: string, operator: FilterOperator) {
		if (!result[slug]) {
			result[slug] = new Set<FilterOperator>();
		}

		result[slug].add(operator);
	}

	function processObject(
		obj: Filter | Filter[] | FieldLevelFilter | FieldLevelFilter[],
		currentSlug?: string
	) {
		// handle arrays (could be array format of logical operators)
		if (Array.isArray(obj)) {
			obj.forEach((item) => processObject(item, currentSlug));
			return;
		}

		for (const [key, value] of entries(obj)) {
			// handle top-level logical operators
			if (isLogicalOperator(key)) {
				processObject(value, currentSlug);
				continue;
			}

			if (currentSlug && isFilterOperator(key)) {
				// this is an operator inside a logical operator
				addOperator(currentSlug, key);
				continue;
			}

			if (Array.isArray(value)) {
				throw new Error(
					`Non logical array value detected for a filter: ${JSON.stringify([key, value])}`
				);
			}

			// handle field slugs (non-logical operators, not special fields)
			if (!key.startsWith("$")) {
				// this is a field slug
				const fieldSlug = key;

				for (const [opKey, opValue] of entries(value)) {
					if (isLogicalOperator(opKey)) {
						// handle logical operators at field level
						processObject(opValue, fieldSlug);
					} else if (isFilterOperator(opKey)) {
						// direct operator
						addOperator(fieldSlug, opKey);
					} else {
						throw new Error(
							`Invalid operator detected for a filter: ${JSON.stringify([opKey, opValue])}`
						);
					}
				}
				return;
			}
		}
	}

	processObject(filter);
	return result;
}
