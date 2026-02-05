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
		kyselyPattern: "db.selectFrom('items').selectAll().where('status', '=', 'active')",
	},
	{
		name: "numeric comparison filter",
		description: "filter by numeric comparison",
		jsonata: "items[price > 100]",
		sql: "SELECT * FROM items WHERE price > 100",
		kyselyPattern: "db.selectFrom('items').selectAll().where('price', '>', 100)",
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
		kyselyPattern: "db.selectFrom('items').selectAll().where('description', 'is not', null)",
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
		kyselyPattern: "db.selectFrom('items').selectAll().orderBy('price', 'desc')",
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
		name: "scalar subquery in filter with variable binding",
		description: "compare to aggregate from subquery using block expression",
		jsonata: '($avg := $average(pubs[type="article"].size); pubs[type="blog" and size > $avg])',
		sql: "SELECT * FROM pubs WHERE type = 'blog' AND size > (SELECT AVG(size) FROM pubs WHERE type = 'article')",
		notes: "block expression with variable binding for scalar subquery",
	},
	{
		name: "scalar subquery with chained filters",
		description: "compare to aggregate using chained filter and root reference",
		jsonata: 'pubs[type="blog"][size > $average($$.pubs[type="article"].size)]',
		sql: "SELECT * FROM pubs WHERE type = 'blog' AND size > (SELECT AVG(size) FROM pubs WHERE type = 'article')",
		notes: "$$ references root to access other table in nested query",
	},
	{
		name: "correlated subquery in projection",
		description: "nested query referencing current row via variable binding",
		jsonata:
			'pubs[type="blog"].($this := $; { "id": id, "laterPubs": $$.pubs[createdAt > $this.createdAt] })',
		sql: "SELECT p.id, (SELECT json_agg(p2.*) FROM pubs p2 WHERE p2.created_at > p.created_at) AS laterPubs FROM pubs p WHERE p.type = 'blog'",
		kyselyPattern:
			"db.selectFrom('pubs as p').select(['p.id', (eb) => jsonArrayFrom(eb.selectFrom('pubs as p2').selectAll().where('p2.created_at', '>', eb.ref('p.created_at'))).as('laterPubs')]).where('p.type', '=', 'blog')",
		notes: "$this := $ captures current context for use in nested query",
	},
	{
		name: "count in nested query",
		description: "scalar aggregate in projection",
		jsonata:
			'pubs.($this := $; { "id": id, "relatedCount": $count($$.pubs[category = $this.category and id != $this.id]) })',
		sql: "SELECT p.id, (SELECT COUNT(*) FROM pubs p2 WHERE p2.category = p.category AND p2.id != p.id) AS relatedCount FROM pubs p",
	},
	{
		name: "nested query with filter and limit",
		description: "correlated subquery with ordering and limiting",
		jsonata:
			'pubs[type="blog"].($this := $; { "id": id, "topRelated": $$.pubs[category = $this.category]^(>score)[[0..2]] })',
		sql: "SELECT p.id, (SELECT json_agg(sub.*) FROM (SELECT * FROM pubs p2 WHERE p2.category = p.category ORDER BY p2.score DESC LIMIT 3) sub) AS topRelated FROM pubs p WHERE p.type = 'blog'",
		notes: "nested query with sort and limit translates to subquery with ORDER BY and LIMIT",
	},
]

// limiting and slicing patterns
export const LIMIT_PATTERNS: TranslationPattern[] = [
	{
		name: "single item access",
		description: "get first item using index",
		jsonata: "items[0]",
		sql: "SELECT * FROM items LIMIT 1",
		kyselyPattern: "db.selectFrom('items').selectAll().limit(1)",
	},
	{
		name: "last item access",
		description: "get last item using negative index",
		jsonata: "items[-1]",
		sql: "SELECT * FROM items ORDER BY id DESC LIMIT 1",
		notes: "requires a default ordering column or explicit sort before",
	},
	{
		name: "range slice first n",
		description: "get first n items using range",
		jsonata: "items[[0..9]]",
		sql: "SELECT * FROM items LIMIT 10",
		kyselyPattern: "db.selectFrom('items').selectAll().limit(10)",
		notes: "jsonata range [0..9] is inclusive, so 10 items",
	},
	{
		name: "range slice with offset",
		description: "get items with offset",
		jsonata: "items[[10..19]]",
		sql: "SELECT * FROM items LIMIT 10 OFFSET 10",
		kyselyPattern: "db.selectFrom('items').selectAll().limit(10).offset(10)",
	},
	{
		name: "sort then limit",
		description: "order by then take first",
		jsonata: "items^(>price)[0]",
		sql: "SELECT * FROM items ORDER BY price DESC LIMIT 1",
		kyselyPattern: "db.selectFrom('items').selectAll().orderBy('price', 'desc').limit(1)",
	},
	{
		name: "sort then range",
		description: "order by then take range",
		jsonata: "items^(>createdAt)[[0..9]]",
		sql: "SELECT * FROM items ORDER BY createdAt DESC LIMIT 10",
		kyselyPattern: "db.selectFrom('items').selectAll().orderBy('createdAt', 'desc').limit(10)",
	},
	{
		name: "filter sort limit chain",
		description: "full query chain with limiting",
		jsonata: "items[status='active']^(>score)[[0..4]]",
		sql: "SELECT * FROM items WHERE status = 'active' ORDER BY score DESC LIMIT 5",
		kyselyPattern:
			"db.selectFrom('items').selectAll().where('status', '=', 'active').orderBy('score', 'desc').limit(5)",
	},
	{
		name: "limit in projection subquery",
		description: "limiting nested query results",
		jsonata:
			'items.($this := $; { "id": id, "top3Related": $$.items[category = $this.category]^(>score)[[0..2]].id })',
		sql: "SELECT i.id, (SELECT json_agg(sub.id) FROM (SELECT id FROM items i2 WHERE i2.category = i.category ORDER BY score DESC LIMIT 3) sub) AS top3Related FROM items i",
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
	...LIMIT_PATTERNS,
	...PROJECTION_PATTERNS,
	...COMPLETE_QUERY_PATTERNS,
]
