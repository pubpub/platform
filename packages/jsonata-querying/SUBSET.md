# JSONata-SQL Subset Specification

This document specifies the subset of JSONata that can be translated to PostgreSQL queries. The goal is to provide a query language familiar to users of JSONata while executing entirely in the database.

## Overview

JSONata is a powerful JSON query and transformation language. However, not all of its features can be expressed in SQL. This specification defines:

1. Which JSONata features are fully supported
2. Which features have partial or contextual support
3. Which features are not supported
4. How supported features translate to SQL

## Variable Conventions

The subset uses specific variable prefixes to distinguish between different contexts:

| Variable | Meaning | SQL Equivalent |
|----------|---------|----------------|
| `$$tableName` | Table reference | `FROM tableName` |
| `$input.field` | Query parameter | Bound parameter value |
| `$varName` | CTE or subquery | `WITH varName AS (...)` |
| `$.field` | Current context field | Column reference |

## Node Type Support

### Fully Supported (Tier 1)

These JSONata constructs translate directly to SQL:

| JSONata | SQL Equivalent | Example |
|---------|---------------|---------|
| String literal | String literal | `"hello"` → `'hello'` |
| Number literal | Numeric literal | `42` → `42` |
| Boolean literal | Boolean literal | `true` → `TRUE` |
| Null literal | NULL | `null` → `NULL` |
| Field name | Column reference | `name` → `name` |
| Comparison operators | Comparison operators | `=`, `!=`, `<`, `<=`, `>`, `>=` |
| Boolean operators | Boolean operators | `and` → `AND`, `or` → `OR` |
| Arithmetic operators | Arithmetic operators | `+`, `-`, `*`, `/`, `%` |
| String concatenation | String concatenation | `&` → `||` |
| Conditional | CASE expression | `a ? b : c` → `CASE WHEN a THEN b ELSE c END` |
| Sort expression | ORDER BY | `^(>field)` → `ORDER BY field DESC` |

### Partially Supported (Tier 2)

These features work with constraints:

| JSONata | SQL Equivalent | Constraints |
|---------|---------------|-------------|
| Regex literals | `~` or `~*` operators | Syntax and capability differences |
| Path expressions | FROM/JOIN/WHERE | First step must establish table context |
| Filter predicates | WHERE clause | Expression must be SQL-expressible |
| Binary `in` | `IN` or `= ANY` | RHS must be array literal or subquery |
| Range operator `..` | `generate_series()` | Both operands must be integers |
| Function calls | SQL functions | Only whitelisted functions |
| Array constructor | `ARRAY[]` | Elements must be SQL-expressible |
| Object constructor | `SELECT ... AS` or `json_build_object` | Keys must be string literals |

### Contextually Supported (Tier 3)

These features work only in specific contexts:

| JSONata | Context | Notes |
|---------|---------|-------|
| `$$` variable | Table reference | Must be followed by table name |
| `$input` variable | Parameters | Values provided at query time |
| Other variables | CTE definition | Must be defined as subqueries |
| Block expressions | CTE chains | Variable bindings become CTEs |
| Bind expressions | CTE definition | `$x := expr` → `WITH x AS (expr)` |

### Not Supported (Tier 4)

These features cannot be translated to SQL:

| JSONata Feature | Reason |
|-----------------|--------|
| Wildcard `*` | Requires schema knowledge at compile time |
| Descendant `**` | No SQL equivalent for recursive descent |
| Parent `%` | Complex scoping not available in SQL |
| Lambda definitions | Functions cannot be defined in SQL |
| Function chaining `~>` | Must be inlined at compile time |
| Partial application `?` | No SQL equivalent |
| Transform `\|...\|` | Mutation operation, not query |
| Focus binding `@` | Complex scoping |
| Index binding `#` | Complex scoping |
| `$eval()` | Dynamic evaluation not safe |
| `$map()`, `$filter()`, `$reduce()` | Require lambda functions |

## Function Support

### Fully Supported Functions

| JSONata | PostgreSQL | Notes |
|---------|------------|-------|
| `$lowercase(s)` | `LOWER(s)` | |
| `$uppercase(s)` | `UPPER(s)` | |
| `$length(s)` | `LENGTH(s)` | |
| `$trim(s)` | `TRIM(s)` | |
| `$floor(n)` | `FLOOR(n)` | |
| `$ceil(n)` | `CEIL(n)` | |
| `$round(n, p)` | `ROUND(n, p)` | |
| `$abs(n)` | `ABS(n)` | |
| `$sqrt(n)` | `SQRT(n)` | |
| `$power(n, p)` | `POWER(n, p)` | |
| `$not(x)` | `NOT x` | |
| `$exists(x)` | `x IS NOT NULL` | |
| `$string(x)` | `CAST(x AS TEXT)` | |
| `$number(x)` | `CAST(x AS NUMERIC)` | |
| `$join(arr, sep)` | `ARRAY_TO_STRING(arr, sep)` | |
| `$base64encode(s)` | `ENCODE(s::bytea, 'base64')` | |
| `$base64decode(s)` | `CONVERT_FROM(DECODE(s, 'base64'), 'UTF8')` | |

### Partially Supported Functions

| JSONata | PostgreSQL | Constraints |
|---------|------------|-------------|
| `$substring(s, start, len)` | `SUBSTRING(s FROM start+1 FOR len)` | Index adjustment: JSONata is 0-based, PostgreSQL is 1-based |
| `$substringBefore(s, d)` | `SPLIT_PART(s, d, 1)` | |
| `$substringAfter(s, d)` | `SUBSTRING(s FROM POSITION(d IN s) + LENGTH(d))` | Behavior differs if delimiter not found |
| `$contains(s, pat)` | `POSITION(pat IN s) > 0` | Regex patterns use `~` operator instead |
| `$split(s, d)` | `STRING_TO_ARRAY(s, d)` | Limit parameter not supported |
| `$replace(s, from, to)` | `REPLACE(s, from, to)` | Regex uses `REGEXP_REPLACE` |
| `$match(s, pattern)` | `REGEXP_MATCHES(s, pattern)` | Return format differs |
| `$sum(arr)` | `SUM(...)` | Requires aggregate context |
| `$count(arr)` | `COUNT(...)` | Requires aggregate context |
| `$max(arr)` | `MAX(...)` | Requires aggregate context |
| `$min(arr)` | `MIN(...)` | Requires aggregate context |
| `$average(arr)` | `AVG(...)` | Requires aggregate context |
| `$distinct(arr)` | `DISTINCT` or `array_agg(DISTINCT ...)` | Context-dependent |
| `$now()` | `NOW()` | Format parameters not supported |
| `$millis()` | `EXTRACT(EPOCH FROM NOW()) * 1000` | |
| `$boolean(x)` | `CASE WHEN ...` | Truthiness rules differ |
| `$type(x)` | `pg_typeof(x)::text` | Type names differ |

### Unsupported Functions

The following functions cannot be translated:

- Higher-order: `$map`, `$filter`, `$reduce`, `$single`, `$sort` (with comparator), `$each`, `$sift`
- URL encoding: `$encodeUrl`, `$decodeUrl`, `$encodeUrlComponent`, `$decodeUrlComponent`
- Formatting: `$formatInteger`, `$parseInteger`, `$pad` (centering)
- Other: `$eval`, `$error`, `$assert`, `$clone`, `$zip`, `$shuffle`

## Translation Patterns

### Basic Selection

```
JSONata: name
SQL:     SELECT name FROM <table>
```

### Filtering

```
JSONata: items[price > 100 and status = 'active']
SQL:     SELECT * FROM items WHERE price > 100 AND status = 'active'
```

### Sorting

```
JSONata: items^(>price, <name)
SQL:     SELECT * FROM items ORDER BY price DESC, name ASC
```

### Projection

```
JSONata: items.{ "name": name, "total": price * quantity }
SQL:     SELECT name, price * quantity AS total FROM items
```

### Conditional

```
JSONata: price > 100 ? "expensive" : "affordable"
SQL:     CASE WHEN price > 100 THEN 'expensive' ELSE 'affordable' END
```

### String Operations

```
JSONata: firstName & ' ' & $uppercase(lastName)
SQL:     firstName || ' ' || UPPER(lastName)
```

### Complete Query

```
JSONata:
items[status = 'active' and price > 100]^(>createdAt).{
  "id": id,
  "name": $uppercase(name),
  "total": $round(price * quantity, 2)
}

SQL:
SELECT
  id,
  UPPER(name) AS name,
  ROUND(price * quantity, 2) AS total
FROM items
WHERE status = 'active' AND price > 100
ORDER BY createdAt DESC
```

## Constraints and Limitations

### The Column Expression Problem

Column references have restrictions on where they can appear:

**Allowed:**
```
items[price > 100]           -- column directly in comparison
items[price * quantity > 1000] -- arithmetic on columns OK
items[$lowercase(name) = 'test'] -- function of column OK
```

**Not Allowed (would require algebraic rearrangement):**
```
items[$round(price) < $input.maxPrice]  -- column inside function compared to parameter
```

The recommendation is to ensure column references appear in positions where SQL can evaluate them directly.

### Aggregate Context

Aggregate functions (`$sum`, `$count`, `$max`, `$min`, `$average`) require special handling:

1. When used on a filtered collection, they become subqueries
2. When used in a projection with GROUP BY, they become aggregate expressions

```
JSONata: items[price > $average(items.price)]
SQL:     SELECT * FROM items WHERE price > (SELECT AVG(price) FROM items)
```

### Relations and Joins

Path expressions that traverse relations require consumer-defined join configuration:

```typescript
const schema = {
  pubs: {
    fields: {
      typeId: { relation: { table: 'pub_types', foreignKey: 'id' } }
    }
  }
}
```

This allows `pubs.type.name` to generate appropriate JOINs.

### JSONB Column Access

For JSONB columns, path expressions use PostgreSQL's JSON operators:

```
JSONata: data.nested.field
SQL:     data->'nested'->>'field'
```

## Implementation Notes

### Validation

Use `validateExpression(expr)` to check if an expression is in the supported subset:

```typescript
import { validateExpression, isValid } from './subset-validator'

const result = validateExpression('items[price > 100]')
if (result.valid) {
  // proceed with translation
} else {
  // handle errors
  console.error(result.errors)
}
```

### Function Mapping

Use `getFunctionMapping(name)` to get translation details for a function:

```typescript
import { getFunctionMapping, isFunctionSupported } from './function-mapping'

if (isFunctionSupported('lowercase')) {
  const mapping = getFunctionMapping('lowercase')
  // mapping.postgresEquivalent === 'LOWER(s)'
}
```

### Node Classification

Use the classification constants to understand support levels:

```typescript
import { 
  NODE_TYPE_CLASSIFICATION,
  BINARY_OPERATOR_CLASSIFICATION,
  SupportTier 
} from './node-classification'

const nodeSupport = NODE_TYPE_CLASSIFICATION['path']
if (nodeSupport.tier === SupportTier.FULL) {
  // fully supported
}
```

## Test Coverage

The test suite validates:

1. **Classification tests** (`subset-validator.test.ts`): Verify expressions are correctly classified as valid/invalid
2. **Translation tests** (`translation-patterns.test.ts`): Verify expected SQL translations for supported patterns
3. **AST structure tests**: Verify JSONata parsing produces expected AST shapes

Run tests with:
```bash
pnpm test
```

## Future Considerations

Features that could potentially be added with more work:

1. **Wildcard expansion**: With schema introspection, `*` could expand to all known columns
2. **Limited parent references**: For simple cases, `%` could translate to lateral joins
3. **Index binding**: `#` could use `ROW_NUMBER()` window function
4. **Custom function registration**: Allow consumers to register SQL function mappings
