import { describe, expect, test } from "vitest"

import { interpolate } from "./index"

describe("interpolate", () => {
	describe("string interpolation with primitives", () => {
		test("interpolates string value", async () => {
			const result = await interpolate('"Hello {{ $.name }}"', { name: "Jim" })
			expect(result).toBe('"Hello Jim"')
		})

		test("interpolates number value", async () => {
			const result = await interpolate('"Count: {{ $.count }}"', { count: 42 })
			expect(result).toBe('"Count: 42"')
		})

		test("interpolates boolean value", async () => {
			const result = await interpolate('"Active: {{ $.active }}"', {
				active: true,
			})
			expect(result).toBe('"Active: true"')
		})

		test("interpolates null value", async () => {
			const result = await interpolate('"Value: {{ $.value }}"', { value: null })
			expect(result).toBe('"Value: null"')
		})

		test("interpolates zero", async () => {
			const result = await interpolate('"Score: {{ $.score }}"', { score: 0 })
			expect(result).toBe('"Score: 0"')
		})

		test("interpolates false", async () => {
			const result = await interpolate('"Flag: {{ $.flag }}"', { flag: false })
			expect(result).toBe('"Flag: false"')
		})
	})

	describe("string interpolation with objects and arrays", () => {
		test("stringifies object", async () => {
			const result = await interpolate('"Data: {{ $.user }}"', {
				user: { name: "Jim", age: 30 },
			})
			expect(result).toBe('"Data: {"name":"Jim","age":30}"')
		})

		test("stringifies array", async () => {
			const result = await interpolate('"Names: {{ $.names }}"', {
				names: ["Jim", "Pam"],
			})
			expect(result).toBe('"Names: ["Jim","Pam"]"')
		})

		test("stringifies nested structures", async () => {
			const result = await interpolate('"Config: {{ $.config }}"', {
				config: { users: ["Jim", "Pam"], active: true },
			})
			expect(result).toBe('"Config: {"users":["Jim","Pam"],"active":true}"')
		})
	})

	describe("multiple interpolations in strings", () => {
		test("concatenates multiple string values", async () => {
			const result = await interpolate('"{{ $.first }} {{ $.last }}"', {
				first: "Jim",
				last: "Halpert",
			})
			expect(result).toBe('"Jim Halpert"')
		})

		test("concatenates mixed types", async () => {
			const result = await interpolate('"User {{ $.name }} has {{ $.count }} items"', {
				name: "Jim",
				count: 5,
			})
			expect(result).toBe('"User Jim has 5 items"')
		})

		test("handles three interpolations", async () => {
			const result = await interpolate('"{{ $.a }}-{{ $.b }}-{{ $.c }}"', {
				a: "one",
				b: "two",
				c: "three",
			})
			expect(result).toBe('"one-two-three"')
		})

		test("handles adjacent interpolations", async () => {
			const result = await interpolate('"{{ $.a }}{{ $.b }}"', {
				a: "hello",
				b: "world",
			})
			expect(result).toBe('"helloworld"')
		})
	})

	describe("raw value extraction", () => {
		test("returns raw string", async () => {
			const result = await interpolate("$.name", { name: "Jim" })
			expect(result).toBe("Jim")
		})

		test("returns raw number", async () => {
			const result = await interpolate("$.count", { count: 42 })
			expect(result).toBe(42)
		})

		test("returns raw boolean", async () => {
			const result = await interpolate("$.active", { active: true })
			expect(result).toBe(true)
		})

		test("returns raw null", async () => {
			const result = await interpolate("$.value", { value: null })
			expect(result).toBe(null)
		})

		test("returns raw object", async () => {
			const result = await interpolate("$.user", {
				user: { name: "Jim", age: 30 },
			})
			expect(result).toEqual({ name: "Jim", age: 30 })
		})

		test("returns raw array", async () => {
			const result = await interpolate("$.names", {
				names: ["Jim", "Pam"],
			})
			expect(result).toEqual(["Jim", "Pam"])
		})

		test("handles whitespace around raw interpolation", async () => {
			const result = await interpolate("  {{ $.value }}  ", { value: 123 })
			expect(result).toBe("  123  ")
		})
	})

	describe("arrays with multiple interpolations", () => {
		test("interpolates array elements", async () => {
			const result = await interpolate("[$.a, $.b]", { a: 1, b: 2 })
			expect(result).toEqual([1, 2])
		})

		test("interpolates mixed types in array", async () => {
			const result = await interpolate("[$.name, $.age, $.active]", {
				name: "Jim",
				age: 30,
				active: true,
			})
			expect(result).toEqual(["Jim", 30, true])
		})

		test("interpolates objects in array", async () => {
			const result = await interpolate("[$.user1, $.user2]", {
				user1: { name: "Jim" },
				user2: { name: "Pam" },
			})
			expect(result).toEqual([{ name: "Jim" }, { name: "Pam" }])
		})
	})

	describe("objects with interpolations", () => {
		test("interpolates object value", async () => {
			const result = await interpolate('{ "key": $.value  }', { value: 42 })
			expect(result).toEqual({ key: 42 })
		})

		test("interpolates keys", async () => {
			const result = await interpolate("{ $.key : $.value }", {
				key: "A",
				value: 42,
			})
			expect(result).toEqual({ A: 42 })
		})

		test("interpolates string in object", async () => {
			const result = await interpolate('{ "name": $.name }', {
				name: "Jim",
			})
			expect(result).toEqual({ name: "Jim" })
		})

		test("can handle spaces and linebreaks around object", async () => {
			const result = await interpolate(
				`  
				{
				                 "name": $.name } `,
				{
					name: "Jim",
				}
			)
			expect(result).toEqual({ name: "Jim" })
		})

		test("interpolates multiple object values", async () => {
			const result = await interpolate('{ "a": $.a, "b": $.b }', {
				a: 1,
				b: 2,
			})
			expect(result).toEqual({ a: 1, b: 2 })
		})
	})

	describe("nested braces in JSONata", () => {
		test("handles object construction in JSONata", async () => {
			const result = await interpolate('$.items.{ "name": name }', {
				items: [{ name: "Jim" }, { name: "Pam" }],
			})
			expect(result).toEqual([{ name: "Jim" }, { name: "Pam" }])
		})

		test("handles nested object literals", async () => {
			const result = await interpolate('$.data.{ "user": { "id": id } }', {
				data: [{ id: 1 }, { id: 2 }],
			})
			expect(result).toEqual([{ user: { id: 1 } }, { user: { id: 2 } }])
		})

		test("handles complex JSONata with multiple braces", async () => {
			const result = await interpolate(
				'$.users[active=true].{ "name": name, "role": role }',
				{
					users: [
						{ name: "Jim", active: true, role: "sales" },
						{ name: "Pam", active: false, role: "reception" },
						{ name: "Dwight", active: true, role: "sales" },
					],
				}
			)
			expect(result).toEqual([
				{ name: "Jim", role: "sales" },
				{ name: "Dwight", role: "sales" },
			])
		})
	})

	describe("JSONata expressions", () => {
		test("handles array indexing", async () => {
			const result = await interpolate("{{ $.people[0] }}", {
				people: ["Jim", "Pam"],
			})
			expect(result).toBe("Jim")
		})

		test("handles property access", async () => {
			const result = await interpolate("{{ $.user.name }}", {
				user: { name: "Jim", age: 30 },
			})
			expect(result).toBe("Jim")
		})

		test("handles JSONata functions", async () => {
			const result = await interpolate("{{ $uppercase($.name) }}", {
				name: "jim",
			})
			expect(result).toBe("JIM")
		})

		test("handles JSONata lowercase", async () => {
			const result = await interpolate("{{ $lowercase($.name) }}", {
				name: "JIM",
			})
			expect(result).toBe("jim")
		})

		test("handles JSONata substring", async () => {
			const result = await interpolate("{{ $substring($.text, 0, 5) }}", {
				text: "Hello World",
			})
			expect(result).toBe("Hello")
		})

		test("handles JSONata split and join", async () => {
			const result = await interpolate("{{ $join($split($.text, ' '), '-') }}", {
				text: "hello world",
			})
			expect(result).toBe("hello-world")
		})
	})

	describe("error cases", () => {
		test("throws on invalid JSONata syntax", async () => {
			await expect(async () => {
				await interpolate("{{ $.invalid]] }}", { invalid: "test" })
			}).rejects.toThrow()
		})

		test("throws on undefined result", async () => {
			await expect(async () => {
				await interpolate("{{ $.missing }}", { name: "Jim" })
			}).rejects.toThrow("expression '$.missing' returned undefined")
		})

		test("throws on undefined in string interpolation", async () => {
			await expect(async () => {
				await interpolate('"Hello {{ $.missing }}"', { name: "Jim" })
			}).rejects.toThrow("expression '$.missing' returned undefined")
		})

		test("throws on unclosed interpolation", async () => {
			await expect(async () => {
				await interpolate("{{ $.name", { name: "Jim" })
			}).rejects.toThrow("unclosed interpolation block starting at position 0")
		})

		test("throws on unclosed nested braces", async () => {
			await expect(async () => {
				await interpolate('{{ $.items.{ "name": name }', {
					items: [{ name: "Jim" }],
				})
			}).rejects.toThrow("unclosed interpolation block")
		})
	})

	describe("edge cases", () => {
		test("handles empty string result", async () => {
			const result = await interpolate("$.value", { value: "" })
			expect(result).toBe("")
		})

		test("handles empty array", async () => {
			const result = await interpolate("$.items", { items: [] })
			expect(result).toEqual([])
		})

		test("handles empty object", async () => {
			const result = await interpolate("$.data", { data: {} })
			expect(result).toEqual({})
		})

		test("handles no interpolations", async () => {
			const result = await interpolate('"just a string"', {})
			expect(result).toBe("just a string")
		})

		test("handles special characters in strings", async () => {
			const result = await interpolate('"Hello {{ $.name }}!"', { name: "Jim" })
			expect(result).toBe('"Hello Jim!"')
		})

		test("handles quotes in interpolated string", async () => {
			const result = await interpolate('"Say {{ $.quote }}"', {
				quote: 'He said "hello"',
			})
			expect(result).toBe('"Say He said "hello""')
		})

		test("handles newlines in data", async () => {
			const result = await interpolate('"Text: {{ $.text }}"', {
				text: "line1\nline2",
			})
			expect(result).toBe('"Text: line1\nline2"')
		})

		test("handles deeply nested data", async () => {
			const result = await interpolate("{{ $.a.b.c.d }}", {
				a: { b: { c: { d: "deep" } } },
			})
			expect(result).toBe("deep")
		})

		test("handles root data primitive", async () => {
			const result = await interpolate("$", 42)
			expect(result).toBe(42)
		})

		test("handles JSONata arithmetic", async () => {
			const result = await interpolate("This is {{ $.a + $.b }}", { a: 5, b: 3 })
			expect(result).toBe("This is 8")
		})

		test("handles JSONata with conditional", async () => {
			const result = await interpolate("{{ $.age > 18 ? 'adult' : 'minor' }}", {
				age: 25,
			})
			expect(result).toBe("adult")
		})
	})
})
