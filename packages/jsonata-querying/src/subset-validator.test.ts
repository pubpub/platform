import { describe, expect, it } from "vitest"

import { getSupportedFunctions, getUnsupportedFunctions } from "./function-mapping.js"
import {
	BINARY_OPERATOR_CLASSIFICATION,
	getFullySupportedNodeTypes,
	getUnsupportedNodeTypes,
	NODE_TYPE_CLASSIFICATION,
	SupportTier,
} from "./node-classification.js"
import { isFullySupported, isValid, validateExpression } from "./subset-validator.js"

describe("node type classification completeness", () => {
	it("should classify all node types", () => {
		const expectedTypes = [
			"string",
			"number",
			"value",
			"regex",
			"name",
			"variable",
			"wildcard",
			"descendant",
			"parent",
			"path",
			"binary",
			"bind",
			"apply",
			"unary",
			"function",
			"partial",
			"lambda",
			"condition",
			"block",
			"transform",
			"sort",
			"error",
		]

		for (const type of expectedTypes) {
			expect(NODE_TYPE_CLASSIFICATION).toHaveProperty(type)
		}
	})

	it("should have unsupported types", () => {
		const unsupported = getUnsupportedNodeTypes()
		expect(unsupported).toContain("wildcard")
		expect(unsupported).toContain("descendant")
		expect(unsupported).toContain("parent")
		expect(unsupported).toContain("apply")
		expect(unsupported).toContain("partial")
		expect(unsupported).toContain("lambda")
		expect(unsupported).toContain("transform")
		expect(unsupported).toContain("error")
	})

	it("should have fully supported types", () => {
		const supported = getFullySupportedNodeTypes()
		expect(supported).toContain("string")
		expect(supported).toContain("number")
		expect(supported).toContain("value")
		expect(supported).toContain("name")
		expect(supported).toContain("condition")
		expect(supported).toContain("sort")
	})
})

describe("binary operator classification", () => {
	it("should support all comparison operators", () => {
		const comparisonOps = ["=", "!=", "<", "<=", ">", ">="]
		for (const op of comparisonOps) {
			const classification =
				BINARY_OPERATOR_CLASSIFICATION[op as keyof typeof BINARY_OPERATOR_CLASSIFICATION]
			expect(classification.tier).not.toBe(SupportTier.UNSUPPORTED)
		}
	})

	it("should support boolean operators", () => {
		expect(BINARY_OPERATOR_CLASSIFICATION["and"].tier).toBe(SupportTier.FULL)
		expect(BINARY_OPERATOR_CLASSIFICATION["or"].tier).toBe(SupportTier.FULL)
	})

	it("should support arithmetic operators", () => {
		const arithmeticOps = ["+", "-", "*", "/", "%"]
		for (const op of arithmeticOps) {
			const classification =
				BINARY_OPERATOR_CLASSIFICATION[op as keyof typeof BINARY_OPERATOR_CLASSIFICATION]
			expect(classification.tier).toBe(SupportTier.FULL)
		}
	})
})

describe("function mapping", () => {
	it("should have supported aggregate functions", () => {
		const supported = getSupportedFunctions()
		const names = supported.map((f) => f.jsonataName)
		expect(names).toContain("sum")
		expect(names).toContain("count")
		expect(names).toContain("max")
		expect(names).toContain("min")
		expect(names).toContain("average")
	})

	it("should have supported string functions", () => {
		const supported = getSupportedFunctions()
		const names = supported.map((f) => f.jsonataName)
		expect(names).toContain("lowercase")
		expect(names).toContain("uppercase")
		expect(names).toContain("length")
		expect(names).toContain("trim")
		expect(names).toContain("substring")
	})

	it("should have unsupported higher-order functions", () => {
		const unsupported = getUnsupportedFunctions()
		const names = unsupported.map((f) => f.jsonataName)
		expect(names).toContain("map")
		expect(names).toContain("filter")
		expect(names).toContain("reduce")
	})
})

describe("expression validation - valid expressions", () => {
	it("should validate simple literals", () => {
		expect(isValid('"hello"')).toBe(true)
		expect(isValid("42")).toBe(true)
		expect(isValid("true")).toBe(true)
		expect(isValid("null")).toBe(true)
	})

	it("should validate simple field access", () => {
		expect(isValid("name")).toBe(true)
		expect(isValid("user.name")).toBe(true)
		expect(isValid("user.address.city")).toBe(true)
	})

	it("should validate comparison expressions", () => {
		expect(isValid("price > 100")).toBe(true)
		expect(isValid("name = 'John'")).toBe(true)
		expect(isValid("age >= 18 and age <= 65")).toBe(true)
	})

	it("should validate filter predicates", () => {
		expect(isValid("items[price > 100]")).toBe(true)
		expect(isValid("users[active = true]")).toBe(true)
		expect(isValid("orders[status = 'pending' and total > 50]")).toBe(true)
	})

	it("should validate sorting", () => {
		expect(isValid("items^(price)")).toBe(true)
		expect(isValid("items^(>price)")).toBe(true)
		expect(isValid("items^(>price, <name)")).toBe(true)
	})

	it("should validate object projections", () => {
		expect(isValid('{"name": user.name, "age": user.age}')).toBe(true)
	})

	it("should validate supported functions", () => {
		expect(isValid("$length(name)")).toBe(true)
		expect(isValid("$lowercase(title)")).toBe(true)
		expect(isValid("$round(price, 2)")).toBe(true)
		expect(isValid("$abs(value)")).toBe(true)
	})

	it("should validate arithmetic expressions", () => {
		expect(isValid("price * quantity")).toBe(true)
		expect(isValid("total - discount")).toBe(true)
		expect(isValid("(price * quantity) * (1 - discount)")).toBe(true)
	})

	it("should validate ternary conditions", () => {
		expect(isValid('status = "active" ? "Yes" : "No"')).toBe(true)
		expect(isValid("price > 100 ? price * 0.9 : price")).toBe(true)
	})

	it("should validate string concatenation", () => {
		expect(isValid("firstName & ' ' & lastName")).toBe(true)
	})

	it("should validate in operator", () => {
		expect(isValid("status in ['active', 'pending']")).toBe(true)
	})

	it("should validate array construction", () => {
		expect(isValid("[1, 2, 3]")).toBe(true)
		expect(isValid("[price, quantity, total]")).toBe(true)
	})

	it("should validate negation", () => {
		expect(isValid("-price")).toBe(true)
		expect(isValid("-5")).toBe(true)
	})

	it("should validate complex nested expressions", () => {
		const expr = `items[price > 100 and status = 'active']^(>price).{
			"name": name,
			"total": price * quantity
		}`
		expect(isValid(expr)).toBe(true)
	})
})

describe("expression validation - invalid expressions", () => {
	it("should reject wildcard", () => {
		const result = validateExpression("user.*")
		expect(result.valid).toBe(false)
		expect(result.errors.some((e) => e.nodeType === "wildcard")).toBe(true)
	})

	it("should reject descendant operator", () => {
		const result = validateExpression("**.name")
		expect(result.valid).toBe(false)
		expect(result.errors.some((e) => e.nodeType === "descendant")).toBe(true)
	})

	it("should reject lambda definitions", () => {
		const result = validateExpression("function($x) { $x * 2 }")
		expect(result.valid).toBe(false)
		expect(result.errors.some((e) => e.nodeType === "lambda")).toBe(true)
	})

	it("should reject apply/chaining operator", () => {
		const result = validateExpression("items ~> $sum()")
		expect(result.valid).toBe(false)
		expect(result.errors.some((e) => e.nodeType === "apply")).toBe(true)
	})

	it("should reject transform operator", () => {
		const result = validateExpression('| user | {"active": true} |')
		expect(result.valid).toBe(false)
		expect(result.errors.some((e) => e.nodeType === "transform")).toBe(true)
	})

	it("should reject partial application", () => {
		const result = validateExpression("$add(?, 5)")
		expect(result.valid).toBe(false)
		expect(result.errors.some((e) => e.nodeType === "partial")).toBe(true)
	})

	it("should reject unsupported functions", () => {
		const result = validateExpression("$map(items, function($x) { $x * 2 })")
		expect(result.valid).toBe(false)
		expect(
			result.errors.some(
				(e) => e.message.includes("$map") && e.message.includes("not supported")
			)
		).toBe(true)
	})

	it("should reject $eval", () => {
		const result = validateExpression('$eval("1 + 2")')
		expect(result.valid).toBe(false)
	})

	it("should reject $filter", () => {
		const result = validateExpression("$filter(items, function($x) { $x > 5 })")
		expect(result.valid).toBe(false)
	})

	it("should reject $reduce", () => {
		const result = validateExpression("$reduce(items, function($acc, $x) { $acc + $x }, 0)")
		expect(result.valid).toBe(false)
	})
})

describe("expression validation - warnings", () => {
	it("should warn about unknown functions", () => {
		const result = validateExpression("$myCustomFunction(x)")
		// should be valid but with warning
		expect(result.valid).toBe(true)
		expect(result.warnings.some((w) => w.includes("$myCustomFunction"))).toBe(true)
	})

	it("should warn about variables needing CTE definition", () => {
		const result = validateExpression("$myVar + 1")
		expect(result.valid).toBe(true)
		expect(result.warnings.some((w) => w.includes("$myVar"))).toBe(true)
	})

	it("should provide constraint warnings for partial support", () => {
		// range operator within array context
		const result = validateExpression("[1..10]")
		// range operator is partial support, should be valid
		expect(result.valid).toBe(true)
		// constraints from binary operator should generate warnings
		expect(result.warnings.some((w) => w.includes("..") || w.includes("range"))).toBe(true)
	})
})

describe("expression validation - edge cases from ideas.md", () => {
	it("should validate the main example from ideas.md", () => {
		// this is the target syntax from ideas.md
		const expr = `items[size < 100 and status = 'active']^(>priority, createdAt).{
			"title": title,
			"snippet": $substring(body, 0, 50)
		}`
		const result = validateExpression(expr)
		expect(result.valid).toBe(true)
	})

	it("should validate nested subquery pattern", () => {
		// from ideas.md: find items where size > average size of another type
		// note: the actual $avg on a subquery would need special handling
		const result = validateExpression("items[type = 'blog' and size > 100]")
		expect(result.valid).toBe(true)
	})

	it("should validate complex filter with arithmetic", () => {
		// this should be valid - arithmetic in filter
		const result = validateExpression("items[(price * quantity) > 1000]")
		expect(result.valid).toBe(true)
	})
})

describe("isFullySupported vs isValid", () => {
	it("should distinguish between fully supported and valid with warnings", () => {
		// simple literal - fully supported
		expect(isFullySupported("42")).toBe(true)
		expect(isValid("42")).toBe(true)

		// custom variable - valid but with warnings
		const customVarExpr = "$customVar"
		expect(isValid(customVarExpr)).toBe(true)
		expect(isFullySupported(customVarExpr)).toBe(false)

		// unsupported - neither valid nor fully supported
		expect(isValid("user.*")).toBe(false)
		expect(isFullySupported("user.*")).toBe(false)
	})
})

describe("parse error handling", () => {
	it("should handle syntax errors gracefully", () => {
		const result = validateExpression("invalid[[[syntax")
		expect(result.valid).toBe(false)
		expect(result.errors[0].message).toContain("Parse error")
	})

	it("should handle empty expression", () => {
		const result = validateExpression("")
		// empty might parse to undefined or error
		expect(result.valid).toBe(false)
	})
})

describe("complex real-world patterns", () => {
	it("should validate query with multiple filters and projection", () => {
		const expr = `orders[status = 'completed' and total > 100]^(>createdAt).{
			"id": id,
			"customer": customer.name,
			"amount": $round(total, 2),
			"date": createdAt
		}`
		expect(isValid(expr)).toBe(true)
	})

	it("should validate query with string functions", () => {
		const expr = `users[$contains($lowercase(email), 'gmail')].{
			"name": $uppercase(firstName) & ' ' & $uppercase(lastName),
			"email": email
		}`
		expect(isValid(expr)).toBe(true)
	})

	it("should validate query with numeric calculations", () => {
		const expr = `products[price > 0].{
			"name": name,
			"priceWithTax": $round(price * 1.2, 2),
			"discount": price > 100 ? $round(price * 0.1, 2) : 0
		}`
		expect(isValid(expr)).toBe(true)
	})

	it("should validate query with in operator", () => {
		const expr = "items[category in ['electronics', 'books', 'clothing']]"
		expect(isValid(expr)).toBe(true)
	})

	it("should validate chained filters", () => {
		const expr = "items[active = true][price > 50][stock > 0]"
		expect(isValid(expr)).toBe(true)
	})
})
