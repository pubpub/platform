type JSONSchema = {
	$schema?: string
	$ref?: string
	$defs?: Record<string, JSONSchema>
	title?: string
	description?: string
	type?: string | string[]
	properties?: Record<string, JSONSchema>
	additionalProperties?: boolean | JSONSchema
	items?: JSONSchema | JSONSchema[]
	allOf?: JSONSchema[]
	oneOf?: JSONSchema[]
	anyOf?: JSONSchema[]
	minItems?: number
	maxItems?: number
}

/**
 * creates a json schema for pub filters with dynamic field slugs
 */
export const createFilterSchema = (fieldSlugs: string[]): JSONSchema => {
	const filterOperators: JSONSchema = {
		type: "object",
		properties: {
			$eq: {
				description: "Equal to",
			},
			$eqi: {
				type: "string",
				description: "Equal to (case insensitive)",
			},
			$ne: {
				description: "Not equal to",
			},
			$nei: {
				type: "string",
				description: "Not equal to (case insensitive)",
			},
			$lt: {
				description: "Less than",
			},
			$lte: {
				description: "Less than or equal to",
			},
			$gt: {
				description: "Greater than",
			},
			$gte: {
				description: "Greater than or equal to",
			},
			$contains: {
				type: "string",
				description: "Contains",
			},
			$notContains: {
				type: "string",
				description: "Does not contain",
			},
			$containsi: {
				type: "string",
				description: "Contains (case insensitive)",
			},
			$notContainsi: {
				type: "string",
				description: "Does not contain (case insensitive)",
			},
			$null: {
				type: "boolean",
				description: "Is null",
			},
			$notNull: {
				type: "boolean",
				description: "Is not null",
			},
			$exists: {
				type: "boolean",
				description: "Exists",
			},
			$in: {
				type: "array",
				description: "In",
			},
			$notIn: {
				type: "array",
				description: "Not in",
			},
			$between: {
				type: "array",
				minItems: 2,
				maxItems: 2,
				description: "Between",
			},
			$startsWith: {
				type: "string",
				description: "Starts with",
			},
			$startsWithi: {
				type: "string",
				description: "Starts with (case insensitive)",
			},
			$endsWith: {
				type: "string",
				description: "Ends with",
			},
			$endsWithi: {
				type: "string",
				description: "Ends with (case insensitive)",
			},
			$jsonPath: {
				type: "string",
				description:
					"JSON path expression for complex json fields. See Postgres documentation for more detail.",
			},
		},
		additionalProperties: false,
	}

	const fieldLevelFilterRef: JSONSchema = {
		$ref: "#/$defs/fieldLevelFilter",
	}

	const fieldLevelFilter: JSONSchema = {
		allOf: [
			filterOperators,
			{
				type: "object",
				properties: {
					$and: {
						oneOf: [fieldLevelFilterRef, { type: "array", items: fieldLevelFilterRef }],
						description: "All conditions must match",
					},
					$or: {
						oneOf: [fieldLevelFilterRef, { type: "array", items: fieldLevelFilterRef }],
						description: "Any condition must match",
					},
					$not: {
						$ref: "#/$defs/fieldLevelFilter",
						description: "Negates the condition",
					},
				},
			},
		],
	}

	const filterRef: JSONSchema = {
		$ref: "#/$defs/filter",
	}

	const fieldSlugProperties: Record<string, JSONSchema> = {}
	for (const slug of fieldSlugs) {
		fieldSlugProperties[slug] = {
			$ref: "#/$defs/fieldLevelFilter",
			description: `Filter by ${slug}`,
		}
	}

	// add built-in fields
	fieldSlugProperties["createdAt"] = {
		$ref: "#/$defs/fieldLevelFilter",
		description: "Filter by creation date",
	}
	fieldSlugProperties["updatedAt"] = {
		$ref: "#/$defs/fieldLevelFilter",
		description: "Filter by last update date",
	}

	const filter: JSONSchema = {
		oneOf: [
			{
				type: "object",
				properties: fieldSlugProperties,
				additionalProperties: {
					$ref: "#/$defs/fieldLevelFilter",
				},
			},
			{
				type: "object",
				properties: {
					$and: {
						oneOf: [filterRef, { type: "array", items: filterRef }],
						description: "All conditions must match",
					},
					$or: {
						oneOf: [filterRef, { type: "array", items: filterRef }],
						description: "Any condition must match",
					},
					$not: {
						$ref: "#/$defs/filter",
						description: "Negates the condition",
					},
				},
				additionalProperties: false,
			},
		],
	}

	return {
		$schema: "http://json-schema.org/draft-07/schema#",
		title: "Pub Filter",
		description: "Filter for querying pubs",
		$defs: {
			fieldLevelFilter,
			filter,
		},
		$ref: "#/$defs/filter",
	}
}

/**
 * creates a simple filter schema without dynamic field slugs
 * useful when field slugs are not known ahead of time
 */
export const createBasicFilterSchema = (): JSONSchema => {
	return createFilterSchema([])
}
