import { SupportTier } from "./node-classification.js"

export interface FunctionMapping {
	jsonataName: string
	jsonataSignature: string
	tier: (typeof SupportTier)[keyof typeof SupportTier]
	sqlEquivalent?: string
	notes: string
	constraints?: string[]
	postgresEquivalent: string | null
	argumentTransform?: string
	examples: Array<{
		jsonata: string
		sql: string
	}>
}

// aggregation functions
export const AGGREGATION_FUNCTIONS: FunctionMapping[] = [
	{
		jsonataName: "sum",
		jsonataSignature: "<a<n>:n>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "SUM",
		notes: "requires aggregate context or array unnesting",
		examples: [
			{
				jsonata: "$sum(prices)",
				sql: "SUM(prices) -- in aggregate context",
			},
			{
				jsonata: "$sum([1, 2, 3])",
				sql: "(SELECT SUM(v) FROM unnest(ARRAY[1, 2, 3]) AS v)",
			},
		],
		constraints: [
			"on column: works in GROUP BY context",
			"on literal array: requires unnest subquery",
		],
	},
	{
		jsonataName: "count",
		jsonataSignature: "<a:n>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "COUNT",
		notes: "requires aggregate context",
		examples: [
			{
				jsonata: "$count(items)",
				sql: "COUNT(items)",
			},
		],
		constraints: ["works in GROUP BY context"],
	},
	{
		jsonataName: "max",
		jsonataSignature: "<a<n>:n>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "MAX",
		notes: "requires aggregate context",
		examples: [
			{
				jsonata: "$max(prices)",
				sql: "MAX(prices)",
			},
		],
		constraints: ["works in GROUP BY context"],
	},
	{
		jsonataName: "min",
		jsonataSignature: "<a<n>:n>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "MIN",
		notes: "requires aggregate context",
		examples: [
			{
				jsonata: "$min(prices)",
				sql: "MIN(prices)",
			},
		],
		constraints: ["works in GROUP BY context"],
	},
	{
		jsonataName: "average",
		jsonataSignature: "<a<n>:n>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "AVG",
		notes: "requires aggregate context",
		examples: [
			{
				jsonata: "$average(scores)",
				sql: "AVG(scores)",
			},
		],
		constraints: [
			"works in GROUP BY context",
			"returns NUMERIC in postgres, not necessarily same precision as jsonata",
		],
	},
]

// string functions
export const STRING_FUNCTIONS: FunctionMapping[] = [
	{
		jsonataName: "string",
		jsonataSignature: "<x-b?:s>",
		tier: SupportTier.FULL,
		postgresEquivalent: "CAST(x AS TEXT) or x::TEXT",
		notes: "type coercion to string",
		examples: [
			{
				jsonata: "$string(123)",
				sql: "CAST(123 AS TEXT)",
			},
			{
				jsonata: "$string(true)",
				sql: "CAST(TRUE AS TEXT)",
			},
		],
	},
	{
		jsonataName: "substring",
		jsonataSignature: "<s-nn?:s>",
		tier: SupportTier.FULL,
		postgresEquivalent: "SUBSTRING(s FROM start FOR length)",
		argumentTransform: "start index is 0-based in jsonata, 1-based in postgres; add 1 to start",
		notes: "index adjustment required",
		examples: [
			{
				jsonata: '$substring("hello", 1, 3)',
				sql: "SUBSTRING('hello' FROM 2 FOR 3) -- 'ell'",
			},
			{
				jsonata: '$substring("hello", 2)',
				sql: "SUBSTRING('hello' FROM 3) -- 'llo'",
			},
		],
		constraints: [
			"jsonata uses 0-based indexing, postgres uses 1-based",
			"negative start in jsonata counts from end, postgres doesn't support this directly",
		],
	},
	{
		jsonataName: "substringBefore",
		jsonataSignature: "<s-s:s>",
		tier: SupportTier.FULL,
		postgresEquivalent: "SPLIT_PART(s, delimiter, 1)",
		notes: "gets text before first occurrence of delimiter",
		examples: [
			{
				jsonata: '$substringBefore("hello-world", "-")',
				sql: "SPLIT_PART('hello-world', '-', 1) -- 'hello'",
			},
		],
	},
	{
		jsonataName: "substringAfter",
		jsonataSignature: "<s-s:s>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "SUBSTRING(s FROM POSITION(delimiter IN s) + LENGTH(delimiter))",
		notes: "gets text after first occurrence of delimiter",
		examples: [
			{
				jsonata: '$substringAfter("hello-world", "-")',
				sql: "SUBSTRING('hello-world' FROM POSITION('-' IN 'hello-world') + 1) -- 'world'",
			},
		],
		constraints: [
			"returns empty string if delimiter not found in jsonata, behavior may differ",
		],
	},
	{
		jsonataName: "lowercase",
		jsonataSignature: "<s-:s>",
		tier: SupportTier.FULL,
		postgresEquivalent: "LOWER(s)",
		notes: "direct mapping",
		examples: [
			{
				jsonata: '$lowercase("HELLO")',
				sql: "LOWER('HELLO')",
			},
		],
	},
	{
		jsonataName: "uppercase",
		jsonataSignature: "<s-:s>",
		tier: SupportTier.FULL,
		postgresEquivalent: "UPPER(s)",
		notes: "direct mapping",
		examples: [
			{
				jsonata: '$uppercase("hello")',
				sql: "UPPER('hello')",
			},
		],
	},
	{
		jsonataName: "length",
		jsonataSignature: "<s-:n>",
		tier: SupportTier.FULL,
		postgresEquivalent: "LENGTH(s) or CHAR_LENGTH(s)",
		notes: "string length",
		examples: [
			{
				jsonata: '$length("hello")',
				sql: "LENGTH('hello') -- 5",
			},
		],
	},
	{
		jsonataName: "trim",
		jsonataSignature: "<s-:s>",
		tier: SupportTier.FULL,
		postgresEquivalent: "TRIM(s)",
		notes: "removes leading and trailing whitespace",
		examples: [
			{
				jsonata: '$trim("  hello  ")',
				sql: "TRIM('  hello  ')",
			},
		],
	},
	{
		jsonataName: "pad",
		jsonataSignature: "<s-ns?:s>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "LPAD/RPAD combination",
		notes: "jsonata pads to center, postgres has LPAD/RPAD",
		examples: [
			{
				jsonata: '$pad("x", 5, "-")',
				sql: "-- requires custom logic for centering, jsonata centers the string",
			},
		],
		constraints: [
			"jsonata centers by default, postgres only has left/right pad",
			"would need custom SQL function for exact behavior",
		],
	},
	{
		jsonataName: "contains",
		jsonataSignature: "<s-(sf):b>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "POSITION(pat IN s) > 0 or s LIKE '%' || pat || '%'",
		notes: "substring containment check",
		examples: [
			{
				jsonata: '$contains("hello", "ell")',
				sql: "POSITION('ell' IN 'hello') > 0",
			},
		],
		constraints: [
			"when pattern is regex, maps to ~ or ~* operators",
			"second arg can be string or regex in jsonata",
		],
	},
	{
		jsonataName: "match",
		jsonataSignature: "<s-f<s:o>n?:a<o>>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "REGEXP_MATCHES(s, pattern)",
		notes: "regex matching with capture groups",
		examples: [
			{
				jsonata: '$match("abc123", /[a-z]+/)',
				sql: "REGEXP_MATCHES('abc123', '[a-z]+')",
			},
		],
		constraints: [
			"return format differs between jsonata and postgres",
			"capture group handling is different",
		],
	},
	{
		jsonataName: "replace",
		jsonataSignature: "<s-(sf)(sf)n?:s>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "REPLACE(s, from, to) or REGEXP_REPLACE",
		notes: "string or regex replacement",
		examples: [
			{
				jsonata: '$replace("hello", "l", "L")',
				sql: "REPLACE('hello', 'l', 'L') -- 'heLLo'",
			},
			{
				jsonata: '$replace("hello", /l/, "L")',
				sql: "REGEXP_REPLACE('hello', 'l', 'L', 'g')",
			},
		],
		constraints: [
			"jsonata replaces all by default, REPLACE does too",
			"regex replacement needs REGEXP_REPLACE with 'g' flag",
			"limit parameter (4th arg) has no direct postgres equivalent",
		],
	},
	{
		jsonataName: "split",
		jsonataSignature: "<s-(sf)n?:a<s>>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "STRING_TO_ARRAY(s, delimiter) or REGEXP_SPLIT_TO_ARRAY",
		notes: "split string into array",
		examples: [
			{
				jsonata: '$split("a,b,c", ",")',
				sql: "STRING_TO_ARRAY('a,b,c', ',')",
			},
		],
		constraints: [
			"limit parameter has no direct equivalent",
			"regex split needs REGEXP_SPLIT_TO_ARRAY",
		],
	},
	{
		jsonataName: "join",
		jsonataSignature: "<a<s>s?:s>",
		tier: SupportTier.FULL,
		postgresEquivalent: "ARRAY_TO_STRING(arr, separator)",
		notes: "join array elements into string",
		examples: [
			{
				jsonata: "$join(['a', 'b', 'c'], ',')",
				sql: "ARRAY_TO_STRING(ARRAY['a', 'b', 'c'], ',')",
			},
		],
	},
]

// numeric functions
export const NUMERIC_FUNCTIONS: FunctionMapping[] = [
	{
		jsonataName: "number",
		jsonataSignature: "<(nsb)-:n>",
		tier: SupportTier.FULL,
		postgresEquivalent: "CAST(x AS NUMERIC) or x::NUMERIC",
		notes: "type coercion to number",
		examples: [
			{
				jsonata: '$number("123")',
				sql: "CAST('123' AS NUMERIC)",
			},
		],
	},
	{
		jsonataName: "floor",
		jsonataSignature: "<n-:n>",
		tier: SupportTier.FULL,
		postgresEquivalent: "FLOOR(n)",
		notes: "direct mapping",
		examples: [
			{
				jsonata: "$floor(3.7)",
				sql: "FLOOR(3.7) -- 3",
			},
		],
	},
	{
		jsonataName: "ceil",
		jsonataSignature: "<n-:n>",
		tier: SupportTier.FULL,
		postgresEquivalent: "CEIL(n)",
		notes: "direct mapping",
		examples: [
			{
				jsonata: "$ceil(3.2)",
				sql: "CEIL(3.2) -- 4",
			},
		],
	},
	{
		jsonataName: "round",
		jsonataSignature: "<n-n?:n>",
		tier: SupportTier.FULL,
		postgresEquivalent: "ROUND(n, precision)",
		notes: "direct mapping",
		examples: [
			{
				jsonata: "$round(3.456, 2)",
				sql: "ROUND(3.456, 2) -- 3.46",
			},
		],
		constraints: ["precision defaults to 0 in both"],
	},
	{
		jsonataName: "abs",
		jsonataSignature: "<n-:n>",
		tier: SupportTier.FULL,
		postgresEquivalent: "ABS(n)",
		notes: "direct mapping",
		examples: [
			{
				jsonata: "$abs(-5)",
				sql: "ABS(-5) -- 5",
			},
		],
	},
	{
		jsonataName: "sqrt",
		jsonataSignature: "<n-:n>",
		tier: SupportTier.FULL,
		postgresEquivalent: "SQRT(n)",
		notes: "direct mapping",
		examples: [
			{
				jsonata: "$sqrt(16)",
				sql: "SQRT(16) -- 4",
			},
		],
	},
	{
		jsonataName: "power",
		jsonataSignature: "<n-n:n>",
		tier: SupportTier.FULL,
		postgresEquivalent: "POWER(n, p)",
		notes: "direct mapping",
		examples: [
			{
				jsonata: "$power(2, 3)",
				sql: "POWER(2, 3) -- 8",
			},
		],
	},
	{
		jsonataName: "random",
		jsonataSignature: "<:n>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "RANDOM()",
		notes: "both return 0-1 but different distributions/seeds",
		examples: [
			{
				jsonata: "$random()",
				sql: "RANDOM()",
			},
		],
		constraints: ["non-deterministic, may affect query caching"],
	},
]

// boolean functions
export const BOOLEAN_FUNCTIONS: FunctionMapping[] = [
	{
		jsonataName: "boolean",
		jsonataSignature: "<x-:b>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "CAST(x AS BOOLEAN) with caveats",
		notes: "jsonata truthiness rules differ from postgres",
		examples: [
			{
				jsonata: '$boolean("")',
				sql: "CASE WHEN '' = '' THEN FALSE ELSE TRUE END -- jsonata: empty string is falsy",
			},
		],
		constraints: [
			"jsonata: empty string, 0, null, empty array/object are falsy",
			"postgres boolean casting is stricter",
		],
	},
	{
		jsonataName: "not",
		jsonataSignature: "<x-:b>",
		tier: SupportTier.FULL,
		postgresEquivalent: "NOT",
		notes: "logical negation",
		examples: [
			{
				jsonata: "$not(true)",
				sql: "NOT TRUE",
			},
		],
	},
	{
		jsonataName: "exists",
		jsonataSignature: "<x:b>",
		tier: SupportTier.FULL,
		postgresEquivalent: "IS NOT NULL or EXISTS",
		notes: "null check",
		examples: [
			{
				jsonata: "$exists(field)",
				sql: "field IS NOT NULL",
			},
		],
	},
]

// array functions
export const ARRAY_FUNCTIONS: FunctionMapping[] = [
	{
		jsonataName: "append",
		jsonataSignature: "<xx:a>",
		tier: SupportTier.FULL,
		postgresEquivalent: "array_cat(arr1, arr2) or arr1 || arr2",
		notes: "concatenate arrays",
		examples: [
			{
				jsonata: "$append([1, 2], [3, 4])",
				sql: "ARRAY[1, 2] || ARRAY[3, 4]",
			},
		],
	},
	{
		jsonataName: "reverse",
		jsonataSignature: "<a:a>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "custom function or SELECT ... ORDER BY idx DESC with unnest",
		notes: "no built-in array reverse in postgres",
		examples: [
			{
				jsonata: "$reverse([1, 2, 3])",
				sql: "(SELECT array_agg(elem ORDER BY idx DESC) FROM unnest(ARRAY[1,2,3]) WITH ORDINALITY AS t(elem, idx))",
			},
		],
	},
	{
		jsonataName: "shuffle",
		jsonataSignature: "<a:a>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "ORDER BY RANDOM()",
		notes: "randomize array order",
		examples: [
			{
				jsonata: "$shuffle([1, 2, 3])",
				sql: "(SELECT array_agg(elem ORDER BY RANDOM()) FROM unnest(ARRAY[1,2,3]) AS elem)",
			},
		],
		constraints: ["non-deterministic"],
	},
	{
		jsonataName: "distinct",
		jsonataSignature: "<x:x>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "DISTINCT or array_agg(DISTINCT ...)",
		notes: "remove duplicates",
		examples: [
			{
				jsonata: "$distinct([1, 1, 2])",
				sql: "(SELECT array_agg(DISTINCT elem) FROM unnest(ARRAY[1,1,2]) AS elem)",
			},
		],
	},
	{
		jsonataName: "sort",
		jsonataSignature: "<af?:a>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "array_agg with ORDER BY",
		notes: "sort array, optional comparator",
		examples: [
			{
				jsonata: "$sort([3, 1, 2])",
				sql: "(SELECT array_agg(elem ORDER BY elem) FROM unnest(ARRAY[3,1,2]) AS elem)",
			},
		],
		constraints: ["custom comparator function not supported"],
	},
	{
		jsonataName: "zip",
		jsonataSignature: "<a+>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "zip multiple arrays together",
		examples: [
			{
				jsonata: "$zip([1, 2], [3, 4])",
				sql: "-- no direct equivalent, would need complex unnest with ordinality",
			},
		],
	},
]

// object functions
export const OBJECT_FUNCTIONS: FunctionMapping[] = [
	{
		jsonataName: "keys",
		jsonataSignature: "<x-:a<s>>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "jsonb_object_keys(obj)",
		notes: "get object keys",
		examples: [
			{
				jsonata: '$keys({"a": 1, "b": 2})',
				sql: '(SELECT array_agg(k) FROM jsonb_object_keys(\'{"a":1,"b":2}\'::jsonb) AS k)',
			},
		],
		constraints: ["only works on jsonb columns/values"],
	},
	{
		jsonataName: "lookup",
		jsonataSignature: "<x-s:x>",
		tier: SupportTier.FULL,
		postgresEquivalent: "obj->key or obj->>key",
		notes: "get value by key",
		examples: [
			{
				jsonata: '$lookup(obj, "key")',
				sql: "obj->'key' -- or obj->>'key' for text",
			},
		],
	},
	{
		jsonataName: "spread",
		jsonataSignature: "<x-:a<o>>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "jsonb_each(obj)",
		notes: "spread object to array of key-value pairs",
		examples: [
			{
				jsonata: '$spread({"a": 1})',
				sql: "SELECT jsonb_build_object(key, value) FROM jsonb_each('{\"a\":1}'::jsonb)",
			},
		],
	},
	{
		jsonataName: "merge",
		jsonataSignature: "<a<o>:o>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "jsonb || jsonb (concatenation)",
		notes: "merge objects, later values override",
		examples: [
			{
				jsonata: '$merge([{"a": 1}, {"b": 2}])',
				sql: "'{\"a\":1}'::jsonb || '{\"b\":2}'::jsonb",
			},
		],
		constraints: ["array of objects needs reduction"],
	},
	{
		jsonataName: "each",
		jsonataSignature: "<o-f:a>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "iterate over object with callback",
		examples: [],
		constraints: ["requires lambda function"],
	},
	{
		jsonataName: "sift",
		jsonataSignature: "<o-f?:o>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "filter object properties",
		examples: [],
		constraints: ["requires lambda function"],
	},
]

// higher-order functions - mostly unsupported
export const HIGHER_ORDER_FUNCTIONS: FunctionMapping[] = [
	{
		jsonataName: "map",
		jsonataSignature: "<af>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "apply function to each element",
		examples: [],
		constraints: ["requires lambda function"],
	},
	{
		jsonataName: "filter",
		jsonataSignature: "<af>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "filter array by predicate",
		examples: [],
		constraints: ["requires lambda function"],
	},
	{
		jsonataName: "single",
		jsonataSignature: "<af?>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "find single matching element",
		examples: [],
		constraints: ["requires lambda function"],
	},
	{
		jsonataName: "reduce",
		jsonataSignature: "<afj?:j>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "fold/reduce array",
		examples: [],
		constraints: ["requires lambda function"],
	},
]

// date/time functions
export const DATETIME_FUNCTIONS: FunctionMapping[] = [
	{
		jsonataName: "now",
		jsonataSignature: "<s?s?:s>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "NOW() or CURRENT_TIMESTAMP",
		notes: "current timestamp",
		examples: [
			{
				jsonata: "$now()",
				sql: "NOW()",
			},
		],
		constraints: [
			"jsonata returns ISO string, postgres returns timestamp type",
			"format parameters in jsonata have no direct equivalent",
		],
	},
	{
		jsonataName: "millis",
		jsonataSignature: "<:n>",
		tier: SupportTier.FULL,
		postgresEquivalent: "EXTRACT(EPOCH FROM NOW()) * 1000",
		notes: "current time as milliseconds",
		examples: [
			{
				jsonata: "$millis()",
				sql: "EXTRACT(EPOCH FROM NOW()) * 1000",
			},
		],
	},
	{
		jsonataName: "toMillis",
		jsonataSignature: "<s-s?:n>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "EXTRACT(EPOCH FROM timestamp) * 1000",
		notes: "parse date string to milliseconds",
		examples: [
			{
				jsonata: '$toMillis("2024-01-15T00:00:00Z")',
				sql: "EXTRACT(EPOCH FROM '2024-01-15T00:00:00Z'::TIMESTAMPTZ) * 1000",
			},
		],
		constraints: ["format string parameter handling differs"],
	},
	{
		jsonataName: "fromMillis",
		jsonataSignature: "<n-s?s?:s>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "TO_TIMESTAMP(ms / 1000)",
		notes: "milliseconds to date string",
		examples: [
			{
				jsonata: "$fromMillis(1705276800000)",
				sql: 'TO_CHAR(TO_TIMESTAMP(1705276800000 / 1000.0), \'YYYY-MM-DD"T"HH24:MI:SS"Z"\')',
			},
		],
		constraints: ["format string parameters have different syntax"],
	},
]

// encoding functions
export const ENCODING_FUNCTIONS: FunctionMapping[] = [
	{
		jsonataName: "base64encode",
		jsonataSignature: "<s-:s>",
		tier: SupportTier.FULL,
		postgresEquivalent: "ENCODE(s::bytea, 'base64')",
		notes: "base64 encoding",
		examples: [
			{
				jsonata: '$base64encode("hello")',
				sql: "ENCODE('hello'::bytea, 'base64')",
			},
		],
	},
	{
		jsonataName: "base64decode",
		jsonataSignature: "<s-:s>",
		tier: SupportTier.FULL,
		postgresEquivalent: "CONVERT_FROM(DECODE(s, 'base64'), 'UTF8')",
		notes: "base64 decoding",
		examples: [
			{
				jsonata: '$base64decode("aGVsbG8=")',
				sql: "CONVERT_FROM(DECODE('aGVsbG8=', 'base64'), 'UTF8')",
			},
		],
	},
	{
		jsonataName: "encodeUrlComponent",
		jsonataSignature: "<s-:s>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "no built-in URL encoding in postgres",
		examples: [],
		constraints: ["would need custom function or extension"],
	},
	{
		jsonataName: "encodeUrl",
		jsonataSignature: "<s-:s>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "no built-in URL encoding in postgres",
		examples: [],
	},
	{
		jsonataName: "decodeUrlComponent",
		jsonataSignature: "<s-:s>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "no built-in URL decoding in postgres",
		examples: [],
	},
	{
		jsonataName: "decodeUrl",
		jsonataSignature: "<s-:s>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "no built-in URL decoding in postgres",
		examples: [],
	},
]

// formatting functions
export const FORMATTING_FUNCTIONS: FunctionMapping[] = [
	{
		jsonataName: "formatNumber",
		jsonataSignature: "<n-so?:s>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "TO_CHAR(n, format)",
		notes: "number formatting with pattern",
		examples: [
			{
				jsonata: '$formatNumber(1234.5, "#,##0.00")',
				sql: "TO_CHAR(1234.5, 'FM999,999,990.00')",
			},
		],
		constraints: ["format string syntax differs between jsonata and postgres"],
	},
	{
		jsonataName: "formatBase",
		jsonataSignature: "<n-n?:s>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "TO_HEX for base 16",
		notes: "format number in different base",
		examples: [
			{
				jsonata: "$formatBase(255, 16)",
				sql: "TO_HEX(255) -- 'ff'",
			},
		],
		constraints: ["only base 16 (hex) has direct support"],
	},
	{
		jsonataName: "formatInteger",
		jsonataSignature: "<n-s:s>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "format integer as words",
		examples: [],
		constraints: ["no built-in number-to-words in postgres"],
	},
	{
		jsonataName: "parseInteger",
		jsonataSignature: "<s-s:n>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "parse words to integer",
		examples: [],
		constraints: ["no built-in words-to-number in postgres"],
	},
]

// other functions
export const OTHER_FUNCTIONS: FunctionMapping[] = [
	{
		jsonataName: "eval",
		jsonataSignature: "<sx?:x>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "dynamic expression evaluation",
		examples: [],
		constraints: ["cannot execute dynamic code in sql safely"],
	},
	{
		jsonataName: "clone",
		jsonataSignature: "<(oa)-:o>",
		tier: SupportTier.CONTEXTUAL,
		postgresEquivalent: "value itself (sql values are immutable)",
		notes: "deep clone, not needed in sql context",
		examples: [],
	},
	{
		jsonataName: "error",
		jsonataSignature: "<s?:x>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "throw error",
		examples: [],
		constraints: ["would need PL/pgSQL RAISE, not available in plain SQL"],
	},
	{
		jsonataName: "assert",
		jsonataSignature: "<bs?:x>",
		tier: SupportTier.UNSUPPORTED,
		postgresEquivalent: null,
		notes: "assertion",
		examples: [],
		constraints: ["would need PL/pgSQL RAISE, not available in plain SQL"],
	},
	{
		jsonataName: "type",
		jsonataSignature: "<x:s>",
		tier: SupportTier.PARTIAL,
		postgresEquivalent: "pg_typeof(value)",
		notes: "get type of value",
		examples: [
			{
				jsonata: "$type(123)",
				sql: "pg_typeof(123)::text",
			},
		],
		constraints: ["type names differ between jsonata and postgres"],
	},
]

// all function mappings combined
export const ALL_FUNCTION_MAPPINGS: FunctionMapping[] = [
	...AGGREGATION_FUNCTIONS,
	...STRING_FUNCTIONS,
	...NUMERIC_FUNCTIONS,
	...BOOLEAN_FUNCTIONS,
	...ARRAY_FUNCTIONS,
	...OBJECT_FUNCTIONS,
	...HIGHER_ORDER_FUNCTIONS,
	...DATETIME_FUNCTIONS,
	...ENCODING_FUNCTIONS,
	...FORMATTING_FUNCTIONS,
	...OTHER_FUNCTIONS,
]

// lookup function by name
export function getFunctionMapping(name: string): FunctionMapping | undefined {
	return ALL_FUNCTION_MAPPINGS.find((f) => f.jsonataName === name)
}

// get all supported functions
export function getSupportedFunctions(): FunctionMapping[] {
	return ALL_FUNCTION_MAPPINGS.filter((f) => f.tier !== SupportTier.UNSUPPORTED)
}

// get all unsupported functions
export function getUnsupportedFunctions(): FunctionMapping[] {
	return ALL_FUNCTION_MAPPINGS.filter((f) => f.tier === SupportTier.UNSUPPORTED)
}

// check if a function is supported
export function isFunctionSupported(name: string): boolean {
	const mapping = getFunctionMapping(name)
	return mapping !== undefined && mapping.tier !== SupportTier.UNSUPPORTED
}
