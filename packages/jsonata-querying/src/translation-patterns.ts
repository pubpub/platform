// conceptual translation patterns from jsonata to sql
// these are not actual implementations, but documentation of expected translations

export interface TranslationPattern {
	name: string
	description: string
	jsonata: string
	sql: string
	notes?: string
	kyselyPattern?: string
}

// basic selection and filtering patterns
export const SELECTION_PATTERNS: TranslationPattern[] = [
	{
		name: "simple field selection",
		description: "select a single field from the context",
		jsonata: "name",
		sql: "SELECT name FROM <table>",
		kyselyPattern: "db.selectFrom('table').select('name')",
	},
	{
		name: "multiple field selection via projection",
		description: "project specific fields using object constructor",
		jsonata: '{ "name": name, "age": age }',
		sql: "SELECT name, age FROM <table>",
		kyselyPattern: "db.selectFrom('table').select(['name', 'age'])",
	},
	{
		name: "aliased field selection",
		description: "project fields with different names",
		jsonata: '{ "fullName": name, "years": age }',
		sql: 'SELECT name AS "fullName", age AS years FROM <table>',
		kyselyPattern:
			"db.selectFrom('table').select([eb => eb.ref('name').as('fullName'), eb => eb.ref('age').as('years')])",
	},
	{
		name: "nested field access - jsonb",
		description: "access nested field in jsonb column",
		jsonata: "address.city",
		sql: "SELECT address->'city' FROM <table>",
		notes: "for jsonb columns, use arrow operator",
		kyselyPattern: "db.selectFrom('table').select(sql`address->'city'`)",
	},
	{
		name: "nested field access - relation",
		description: "access field through relation",
		jsonata: "author.name",
		sql: "SELECT authors.name FROM <table> JOIN authors ON <table>.authorId = authors.id",
		notes: "for relations, requires join definition from consumer",
	},
]

// filtering patterns
export const FILTER_PATTERNS: TranslationPattern[] = [
	{
		name: "simple equality filter",
		description: "filter by exact match",
		jsonata: "items[status = 'active']",
		sql: "SELECT * FROM items WHERE status = 'active'",
		kyselyPattern:
			"db.selectFrom('items').selectAll().where('status', '=', 'active')",
	},
	{
		name: "numeric comparison filter",
		description: "filter by numeric comparison",
		jsonata: "items[price > 100]",
		sql: "SELECT * FROM items WHERE price > 100",
		kyselyPattern:
			"db.selectFrom('items').selectAll().where('price', '>', 100)",
	},
	{
		name: "compound filter with and",
		description: "filter with multiple conditions",
		jsonata: "items[price > 100 and status = 'active']",
		sql: "SELECT * FROM items WHERE price > 100 AND status = 'active'",
		kyselyPattern:
			"db.selectFrom('items').selectAll().where('price', '>', 100).where('status', '=', 'active')",
	},
	{
		name: "compound filter with or",
		description: "filter with or condition",
		jsonata: "items[status = 'active' or status = 'pending']",
		sql: "SELECT * FROM items WHERE status = 'active' OR status = 'pending'",
		kyselyPattern:
			"db.selectFrom('items').selectAll().where(eb => eb.or([eb('status', '=', 'active'), eb('status', '=', 'pending')]))",
	},
	{
		name: "in operator filter",
		description: "filter using membership test",
		jsonata: "items[status in ['active', 'pending']]",
		sql: "SELECT * FROM items WHERE status IN ('active', 'pending')",
		kyselyPattern:
			"db.selectFrom('items').selectAll().where('status', 'in', ['active', 'pending'])",
	},
	{
		name: "chained filters",
		description: "multiple filter predicates",
		jsonata: "items[active = true][price > 50]",
		sql: "SELECT * FROM items WHERE active = TRUE AND price > 50",
		notes: "chained filters are combined with AND",
	},
	{
		name: "null check filter",
		description: "filter for non-null values",
		jsonata: "items[$exists(description)]",
		sql: "SELECT * FROM items WHERE description IS NOT NULL",
		kyselyPattern:
			"db.selectFrom('items').selectAll().where('description', 'is not', null)",
	},
	{
		name: "contains filter",
		description: "filter by substring containment",
		jsonata: "items[$contains(name, 'test')]",
		sql: "SELECT * FROM items WHERE name LIKE '%test%'",
		notes: "alternatively: POSITION('test' IN name) > 0",
	},
]

// sorting patterns
export const SORT_PATTERNS: TranslationPattern[] = [
	{
		name: "ascending sort",
		description: "sort by field ascending (default)",
		jsonata: "items^(price)",
		sql: "SELECT * FROM items ORDER BY price ASC",
		kyselyPattern: "db.selectFrom('items').selectAll().orderBy('price', 'asc')",
	},
	{
		name: "descending sort",
		description: "sort by field descending",
		jsonata: "items^(>price)",
		sql: "SELECT * FROM items ORDER BY price DESC",
		kyselyPattern:
			"db.selectFrom('items').selectAll().orderBy('price', 'desc')",
	},
	{
		name: "multi-column sort",
		description: "sort by multiple fields",
		jsonata: "items^(>priority, <createdAt)",
		sql: "SELECT * FROM items ORDER BY priority DESC, createdAt ASC",
		kyselyPattern:
			"db.selectFrom('items').selectAll().orderBy('priority', 'desc').orderBy('createdAt', 'asc')",
	},
	{
		name: "sort with filter",
		description: "filter then sort",
		jsonata: "items[active = true]^(>price)",
		sql: "SELECT * FROM items WHERE active = TRUE ORDER BY price DESC",
	},
]

// arithmetic patterns
export const ARITHMETIC_PATTERNS: TranslationPattern[] = [
	{
		name: "simple addition",
		description: "add two values",
		jsonata: "price + tax",
		sql: "price + tax",
	},
	{
		name: "multiplication",
		description: "multiply values",
		jsonata: "price * quantity",
		sql: "price * quantity",
	},
	{
		name: "complex expression",
		description: "combined arithmetic",
		jsonata: "(price * quantity) * (1 - discount)",
		sql: "(price * quantity) * (1 - discount)",
	},
	{
		name: "arithmetic in projection",
		description: "calculate derived field",
		jsonata: '{ "total": price * quantity }',
		sql: "SELECT price * quantity AS total FROM <table>",
	},
	{
		name: "arithmetic in filter",
		description: "filter by calculated value",
		jsonata: "items[(price * quantity) > 1000]",
		sql: "SELECT * FROM items WHERE (price * quantity) > 1000",
	},
]

// string function patterns
export const STRING_PATTERNS: TranslationPattern[] = [
	{
		name: "lowercase",
		description: "convert to lowercase",
		jsonata: "$lowercase(name)",
		sql: "LOWER(name)",
	},
	{
		name: "uppercase",
		description: "convert to uppercase",
		jsonata: "$uppercase(name)",
		sql: "UPPER(name)",
	},
	{
		name: "string length",
		description: "get string length",
		jsonata: "$length(name)",
		sql: "LENGTH(name)",
	},
	{
		name: "trim whitespace",
		description: "remove leading/trailing whitespace",
		jsonata: "$trim(name)",
		sql: "TRIM(name)",
	},
	{
		name: "substring",
		description: "extract substring",
		jsonata: "$substring(name, 0, 10)",
		sql: "SUBSTRING(name FROM 1 FOR 10)",
		notes: "jsonata is 0-indexed, postgres is 1-indexed",
	},
	{
		name: "string concatenation",
		description: "concatenate strings",
		jsonata: "firstName & ' ' & lastName",
		sql: "firstName || ' ' || lastName",
	},
	{
		name: "contains check",
		description: "check if string contains substring",
		jsonata: "$contains(email, '@gmail.com')",
		sql: "POSITION('@gmail.com' IN email) > 0",
		notes: "or: email LIKE '%@gmail.com%'",
	},
	{
		name: "split string",
		description: "split string to array",
		jsonata: "$split(tags, ',')",
		sql: "STRING_TO_ARRAY(tags, ',')",
	},
	{
		name: "join array",
		description: "join array to string",
		jsonata: "$join(tags, ', ')",
		sql: "ARRAY_TO_STRING(tags, ', ')",
	},
]

// numeric function patterns
export const NUMERIC_PATTERNS: TranslationPattern[] = [
	{
		name: "round",
		description: "round to precision",
		jsonata: "$round(price, 2)",
		sql: "ROUND(price, 2)",
	},
	{
		name: "floor",
		description: "round down",
		jsonata: "$floor(value)",
		sql: "FLOOR(value)",
	},
	{
		name: "ceil",
		description: "round up",
		jsonata: "$ceil(value)",
		sql: "CEIL(value)",
	},
	{
		name: "absolute value",
		description: "get absolute value",
		jsonata: "$abs(value)",
		sql: "ABS(value)",
	},
	{
		name: "power",
		description: "raise to power",
		jsonata: "$power(base, exponent)",
		sql: "POWER(base, exponent)",
	},
	{
		name: "square root",
		description: "calculate square root",
		jsonata: "$sqrt(value)",
		sql: "SQRT(value)",
	},
]

// aggregate function patterns
export const AGGREGATE_PATTERNS: TranslationPattern[] = [
	{
		name: "sum aggregate",
		description: "sum of values",
		jsonata: "$sum(items.price)",
		sql: "SELECT SUM(price) FROM items",
		notes: "requires aggregate context",
	},
	{
		name: "count aggregate",
		description: "count of items",
		jsonata: "$count(items)",
		sql: "SELECT COUNT(*) FROM items",
	},
	{
		name: "max aggregate",
		description: "maximum value",
		jsonata: "$max(items.price)",
		sql: "SELECT MAX(price) FROM items",
	},
	{
		name: "min aggregate",
		description: "minimum value",
		jsonata: "$min(items.price)",
		sql: "SELECT MIN(price) FROM items",
	},
	{
		name: "average aggregate",
		description: "average value",
		jsonata: "$average(items.price)",
		sql: "SELECT AVG(price) FROM items",
	},
	{
		name: "aggregate in subquery",
		description: "use aggregate result in filter",
		jsonata: "items[price > $average(items.price)]",
		sql: "SELECT * FROM items WHERE price > (SELECT AVG(price) FROM items)",
		notes: "requires subquery extraction",
	},
]

// conditional patterns
export const CONDITIONAL_PATTERNS: TranslationPattern[] = [
	{
		name: "simple ternary",
		description: "if-then-else",
		jsonata: 'active ? "Yes" : "No"',
		sql: "CASE WHEN active THEN 'Yes' ELSE 'No' END",
	},
	{
		name: "ternary in projection",
		description: "conditional field",
		jsonata: '{ "label": price > 100 ? "expensive" : "affordable" }',
		sql: "SELECT CASE WHEN price > 100 THEN 'expensive' ELSE 'affordable' END AS label FROM <table>",
	},
	{
		name: "nested ternary",
		description: "multiple conditions",
		jsonata: 'score >= 90 ? "A" : score >= 80 ? "B" : "C"',
		sql: "CASE WHEN score >= 90 THEN 'A' WHEN score >= 80 THEN 'B' ELSE 'C' END",
	},
	{
		name: "null coalescing equivalent",
		description: "default for null",
		jsonata: 'name ? name : "Unknown"',
		sql: "COALESCE(name, 'Unknown')",
		notes: "jsonata ?: operator equivalent",
	},
]

// subquery patterns
export const SUBQUERY_PATTERNS: TranslationPattern[] = [
	{
		name: "scalar subquery in filter",
		description: "compare to aggregate from subquery",
		jsonata: "items[price > $avg(otherItems.price)]",
		sql: "SELECT * FROM items WHERE price > (SELECT AVG(price) FROM otherItems)",
	},
	{
		name: "exists subquery",
		description: "check existence in related table",
		jsonata: "orders[$exists(items[productId = %.orderId])]",
		sql: "SELECT * FROM orders WHERE EXISTS (SELECT 1 FROM items WHERE items.orderId = orders.id)",
		notes: "% parent reference would need special handling",
	},
]

// projection patterns
export const PROJECTION_PATTERNS: TranslationPattern[] = [
	{
		name: "full object projection",
		description: "select multiple fields as object",
		jsonata: `items.{
			"id": id,
			"name": name,
			"total": price * quantity
		}`,
		sql: "SELECT id, name, price * quantity AS total FROM items",
	},
	{
		name: "nested projection",
		description: "project with nested objects",
		jsonata: `items.{
			"id": id,
			"details": {
				"name": name,
				"price": price
			}
		}`,
		sql: "SELECT id, json_build_object('name', name, 'price', price) AS details FROM items",
		notes: "nested objects use json_build_object in postgres",
	},
	{
		name: "projection with functions",
		description: "transform values in projection",
		jsonata: `items.{
			"name": $uppercase(name),
			"price": $round(price, 2)
		}`,
		sql: "SELECT UPPER(name) AS name, ROUND(price, 2) AS price FROM items",
	},
]

// combined patterns showing full query structure
export const COMPLETE_QUERY_PATTERNS: TranslationPattern[] = [
	{
		name: "full query with filter, sort, and projection",
		description: "complete query pattern",
		jsonata: `items[status = 'active' and price > 100]^(>createdAt).{
			"id": id,
			"name": $uppercase(name),
			"total": $round(price * quantity, 2)
		}`,
		sql: `SELECT
	id,
	UPPER(name) AS name,
	ROUND(price * quantity, 2) AS total
FROM items
WHERE status = 'active' AND price > 100
ORDER BY createdAt DESC`,
	},
	{
		name: "query with string operations",
		description: "filter and transform strings",
		jsonata: `users[$contains($lowercase(email), 'gmail')].{
			"displayName": firstName & ' ' & lastName,
			"email": $lowercase(email)
		}`,
		sql: `SELECT
	firstName || ' ' || lastName AS "displayName",
	LOWER(email) AS email
FROM users
WHERE POSITION('gmail' IN LOWER(email)) > 0`,
	},
	{
		name: "query with conditional logic",
		description: "use ternary in projection",
		jsonata: `products[inStock = true]^(<price).{
			"name": name,
			"priceLabel": price > 100 ? "Premium" : "Standard",
			"finalPrice": $round(price * (1 - discount), 2)
		}`,
		sql: `SELECT
	name,
	CASE WHEN price > 100 THEN 'Premium' ELSE 'Standard' END AS "priceLabel",
	ROUND(price * (1 - discount), 2) AS "finalPrice"
FROM products
WHERE inStock = TRUE
ORDER BY price ASC`,
	},
]

// all patterns combined for testing
export const ALL_PATTERNS: TranslationPattern[] = [
	...SELECTION_PATTERNS,
	...FILTER_PATTERNS,
	...SORT_PATTERNS,
	...ARITHMETIC_PATTERNS,
	...STRING_PATTERNS,
	...NUMERIC_PATTERNS,
	...AGGREGATE_PATTERNS,
	...CONDITIONAL_PATTERNS,
	...SUBQUERY_PATTERNS,
	...PROJECTION_PATTERNS,
	...COMPLETE_QUERY_PATTERNS,
]
