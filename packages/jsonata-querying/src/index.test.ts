import { describe, expect, test } from "vitest"

import { interpolate } from "./index.js"

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
	})

	describe("pure jsonata mode", () => {
		test("evaluates simple field access", async () => {
			const result = await interpolate("$.name", { name: "test" })
			expect(result).toBe("test")
		})

		test("evaluates array access", async () => {
			const result = await interpolate("$.items[0]", { items: [1, 2, 3] })
			expect(result).toBe(1)
		})
	})
})
