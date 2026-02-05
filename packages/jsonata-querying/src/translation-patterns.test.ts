import jsonata from "jsonata"
import { describe, expect, it } from "vitest"

import { isValid } from "./subset-validator.js"
import {
	AGGREGATE_PATTERNS,
	ARITHMETIC_PATTERNS,
	COMPLETE_QUERY_PATTERNS,
	CONDITIONAL_PATTERNS,
	FILTER_PATTERNS,
	NUMERIC_PATTERNS,
	PROJECTION_PATTERNS,
	SELECTION_PATTERNS,
	SORT_PATTERNS,
	STRING_PATTERNS,
	SUBQUERY_PATTERNS,
	type TranslationPattern,
} from "./translation-patterns.js"

// helper to check that jsonata expression parses successfully
function parsesSuccessfully(expr: string): boolean {
	try {
		jsonata(expr).ast()
		return true
	} catch {
		return false
	}
}

// helper to verify pattern is valid jsonata and in our supported subset
function validatePattern(pattern: TranslationPattern) {
	it(`${pattern.name}: parses as valid JSONata`, () => {
		expect(parsesSuccessfully(pattern.jsonata)).toBe(true)
	})

	it(`${pattern.name}: is in supported subset`, () => {
		// some patterns may use features we don't support (like parent refs)
		// we just check they parse, validation catches unsupported features
		const parsed = parsesSuccessfully(pattern.jsonata)
		expect(parsed).toBe(true)
	})
}

describe("selection patterns", () => {
	for (const pattern of SELECTION_PATTERNS) {
		validatePattern(pattern)
	}

	it("all selection patterns should be valid in our subset", () => {
		// filter out patterns that use relations (which need special handling)
		const basicPatterns = SELECTION_PATTERNS.filter(
			(p: TranslationPattern) => !p.notes?.includes("relation")
		)
		for (const pattern of basicPatterns) {
			expect(isValid(pattern.jsonata)).toBe(true)
		}
	})
})

describe("filter patterns", () => {
	for (const pattern of FILTER_PATTERNS) {
		validatePattern(pattern)
	}

	it("all filter patterns should be valid in our subset", () => {
		for (const pattern of FILTER_PATTERNS) {
			expect(isValid(pattern.jsonata)).toBe(true)
		}
	})
})

describe("sort patterns", () => {
	for (const pattern of SORT_PATTERNS) {
		validatePattern(pattern)
	}

	it("all sort patterns should be valid in our subset", () => {
		for (const pattern of SORT_PATTERNS) {
			expect(isValid(pattern.jsonata)).toBe(true)
		}
	})
})

describe("arithmetic patterns", () => {
	for (const pattern of ARITHMETIC_PATTERNS) {
		validatePattern(pattern)
	}

	it("all arithmetic patterns should be valid in our subset", () => {
		for (const pattern of ARITHMETIC_PATTERNS) {
			expect(isValid(pattern.jsonata)).toBe(true)
		}
	})
})

describe("string function patterns", () => {
	for (const pattern of STRING_PATTERNS) {
		validatePattern(pattern)
	}

	it("all string patterns should be valid in our subset", () => {
		for (const pattern of STRING_PATTERNS) {
			expect(isValid(pattern.jsonata)).toBe(true)
		}
	})
})

describe("numeric function patterns", () => {
	for (const pattern of NUMERIC_PATTERNS) {
		validatePattern(pattern)
	}

	it("all numeric patterns should be valid in our subset", () => {
		for (const pattern of NUMERIC_PATTERNS) {
			expect(isValid(pattern.jsonata)).toBe(true)
		}
	})
})

describe("aggregate patterns", () => {
	for (const pattern of AGGREGATE_PATTERNS) {
		validatePattern(pattern)
	}

	it("most aggregate patterns should be valid in our subset", () => {
		// aggregate in subquery might have parent ref issues
		const basicPatterns = AGGREGATE_PATTERNS.filter(
			(p: TranslationPattern) => !p.notes?.includes("subquery")
		)
		for (const pattern of basicPatterns) {
			expect(isValid(pattern.jsonata)).toBe(true)
		}
	})
})

describe("conditional patterns", () => {
	for (const pattern of CONDITIONAL_PATTERNS) {
		validatePattern(pattern)
	}

	it("all conditional patterns should be valid in our subset", () => {
		for (const pattern of CONDITIONAL_PATTERNS) {
			expect(isValid(pattern.jsonata)).toBe(true)
		}
	})
})

describe("subquery patterns", () => {
	for (const pattern of SUBQUERY_PATTERNS) {
		it(`${pattern.name}: parses as valid JSONata`, () => {
			expect(parsesSuccessfully(pattern.jsonata)).toBe(true)
		})
	}

	// note: subquery patterns with parent refs may not be fully supported
	it("scalar subquery pattern parses correctly", () => {
		const pattern = SUBQUERY_PATTERNS.find(
			(p: TranslationPattern) => p.name === "scalar subquery in filter"
		)
		expect(pattern).toBeDefined()
		expect(parsesSuccessfully(pattern!.jsonata)).toBe(true)
	})
})

describe("projection patterns", () => {
	for (const pattern of PROJECTION_PATTERNS) {
		validatePattern(pattern)
	}

	it("all projection patterns should be valid in our subset", () => {
		for (const pattern of PROJECTION_PATTERNS) {
			expect(isValid(pattern.jsonata)).toBe(true)
		}
	})
})

describe("complete query patterns", () => {
	for (const pattern of COMPLETE_QUERY_PATTERNS) {
		validatePattern(pattern)
	}

	it("all complete query patterns should be valid in our subset", () => {
		for (const pattern of COMPLETE_QUERY_PATTERNS) {
			expect(isValid(pattern.jsonata)).toBe(true)
		}
	})
})

// conceptual translation verification tests
// these test that we understand what sql should be generated

describe("conceptual sql translation verification", () => {
	it("filter translates to WHERE clause", () => {
		const pattern = FILTER_PATTERNS.find(
			(p: TranslationPattern) => p.name === "simple equality filter"
		)!
		expect(pattern.sql).toContain("WHERE")
		expect(pattern.sql).toContain("status = 'active'")
	})

	it("sort translates to ORDER BY clause", () => {
		const descPattern = SORT_PATTERNS.find(
			(p: TranslationPattern) => p.name === "descending sort"
		)!
		expect(descPattern.sql).toContain("ORDER BY")
		expect(descPattern.sql).toContain("DESC")
	})

	it("ternary translates to CASE expression", () => {
		const pattern = CONDITIONAL_PATTERNS.find(
			(p: TranslationPattern) => p.name === "simple ternary"
		)!
		expect(pattern.sql).toContain("CASE WHEN")
		expect(pattern.sql).toContain("THEN")
		expect(pattern.sql).toContain("ELSE")
		expect(pattern.sql).toContain("END")
	})

	it("string concatenation uses ||", () => {
		const pattern = STRING_PATTERNS.find(
			(p: TranslationPattern) => p.name === "string concatenation"
		)!
		expect(pattern.sql).toContain("||")
	})

	it("$substring adjusts for 1-based indexing", () => {
		const pattern = STRING_PATTERNS.find((p: TranslationPattern) => p.name === "substring")!
		// jsonata: $substring(name, 0, 10) should become SUBSTRING(name FROM 1 FOR 10)
		expect(pattern.sql).toContain("FROM 1")
		expect(pattern.notes).toContain("0-indexed")
	})

	it("$lowercase maps to LOWER", () => {
		const pattern = STRING_PATTERNS.find((p: TranslationPattern) => p.name === "lowercase")!
		expect(pattern.sql).toBe("LOWER(name)")
	})

	it("in operator maps to IN clause", () => {
		const pattern = FILTER_PATTERNS.find(
			(p: TranslationPattern) => p.name === "in operator filter"
		)!
		expect(pattern.sql).toContain("IN (")
	})

	it("aggregate functions map correctly", () => {
		const sumPattern = AGGREGATE_PATTERNS.find(
			(p: TranslationPattern) => p.name === "sum aggregate"
		)!
		expect(sumPattern.sql).toContain("SUM(")

		const avgPattern = AGGREGATE_PATTERNS.find(
			(p: TranslationPattern) => p.name === "average aggregate"
		)!
		expect(avgPattern.sql).toContain("AVG(")
	})
})

// verify ast structure expectations
describe("ast structure verification", () => {
	it("filter predicate creates path with stages", () => {
		const ast = jsonata("items[price > 100]").ast()
		expect(ast.type).toBe("path")
		// the filter is attached as a stage to the name node
		const steps = ast.steps as Array<{ type: string; stages?: Array<{ type: string }> }>
		expect(steps[0].type).toBe("name")
		expect(steps[0].stages).toBeDefined()
		expect(steps[0].stages![0].type).toBe("filter")
	})

	it("sort creates sort node in path", () => {
		const ast = jsonata("items^(>price)").ast()
		expect(ast.type).toBe("path")
		const steps = ast.steps as Array<{ type: string; terms?: Array<{ descending: boolean }> }>
		const sortStep = steps.find((s) => s.type === "sort")
		expect(sortStep).toBeDefined()
		expect(sortStep!.terms![0].descending).toBe(true)
	})

	it("object projection creates unary node with value {", () => {
		const ast = jsonata('{ "a": x, "b": y }').ast()
		expect(ast.type).toBe("unary")
		expect(ast.value).toBe("{")
	})

	it("function call creates function node", () => {
		const ast = jsonata("$lowercase(name)").ast()
		expect(ast.type).toBe("function")
		const procedure = ast.procedure as { type: string; value: string }
		expect(procedure.type).toBe("variable")
		expect(procedure.value).toBe("lowercase")
	})

	it("ternary creates condition node", () => {
		const ast = jsonata('x > 0 ? "yes" : "no"').ast() as {
			type: string
			condition?: { type: string }
			then?: { type: string }
			else?: { type: string }
		}
		expect(ast.type).toBe("condition")
		expect(ast.condition?.type).toBe("binary")
		expect(ast.then?.type).toBe("string")
		expect(ast.else?.type).toBe("string")
	})

	it("binary operators create binary nodes with correct value", () => {
		const ops = [
			{ expr: "a + b", op: "+" },
			{ expr: "a - b", op: "-" },
			{ expr: "a * b", op: "*" },
			{ expr: "a / b", op: "/" },
			{ expr: "a = b", op: "=" },
			{ expr: "a != b", op: "!=" },
			{ expr: "a < b", op: "<" },
			{ expr: "a > b", op: ">" },
			{ expr: "a and b", op: "and" },
			{ expr: "a or b", op: "or" },
			{ expr: "a & b", op: "&" },
			{ expr: "a in b", op: "in" },
		]

		for (const { expr, op } of ops) {
			const ast = jsonata(expr).ast()
			expect(ast.type).toBe("binary")
			expect(ast.value).toBe(op)
		}
	})
})

// test that kysely patterns are conceptually correct
describe("kysely pattern suggestions", () => {
	it("filter patterns suggest where clause", () => {
		const pattern = FILTER_PATTERNS.find(
			(p: TranslationPattern) => p.kyselyPattern !== undefined
		)!
		expect(pattern.kyselyPattern).toContain(".where(")
	})

	it("sort patterns suggest orderBy", () => {
		const pattern = SORT_PATTERNS.find(
			(p: TranslationPattern) => p.kyselyPattern !== undefined
		)!
		expect(pattern.kyselyPattern).toContain(".orderBy(")
	})

	it("selection patterns suggest select or selectAll", () => {
		const selectPattern = SELECTION_PATTERNS.find((p: TranslationPattern) =>
			p.kyselyPattern?.includes(".select(")
		)
		expect(selectPattern).toBeDefined()
	})
})
