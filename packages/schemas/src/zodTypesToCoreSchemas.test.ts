import { describe, expect, it } from "vitest"
import { z } from "zod"

import { CoreSchemaType } from "db/public"

import { zodTypeToCoreSchemaType } from "./zodTypesToCoreSchemas"

class Markdown extends z.ZodString {
	static create = () =>
		new Markdown({
			typeName: "Markdown" as z.ZodFirstPartyTypeKind.ZodString,
			checks: [],
			coerce: false,
		})

	_parse(): z.ParseReturnType<string> {
		return {
			status: "valid",
			value: "",
		}
	}
}

describe("zodTypeToCoreSchemaType", () => {
	it("should return String for ZodString", () => {
		const schema = z.string()
		expect(zodTypeToCoreSchemaType(schema)).toBe(CoreSchemaType.String)
	})

	it("should return MemberId for ZodString with isUUID", () => {
		const schema = z.string().uuid()
		expect(zodTypeToCoreSchemaType(schema)).toBe(CoreSchemaType.MemberId)
	})

	it("should return Email for ZodString with isEmail", () => {
		const schema = z.string().email()
		expect(zodTypeToCoreSchemaType(schema)).toBe(CoreSchemaType.Email)
	})

	it("should return URL for ZodString with isURL", () => {
		const schema = z.string().url()
		expect(zodTypeToCoreSchemaType(schema)).toBe(CoreSchemaType.URL)
	})

	it("should return DateTime for ZodDate", () => {
		const schema = z.date().default(new Date())
		expect(zodTypeToCoreSchemaType(schema)).toBe(CoreSchemaType.DateTime)
	})

	it("should return Boolean for ZodBoolean", () => {
		const schema = z.boolean().nullish()
		expect(zodTypeToCoreSchemaType(schema)).toBe(CoreSchemaType.Boolean)
	})

	it("should handle ZodOptional", () => {
		const schema = z.string().optional()
		expect(zodTypeToCoreSchemaType(schema)).toBe(CoreSchemaType.String)
	})

	it("should handle ZodNullable", () => {
		const schema = z.string().nullable()
		expect(zodTypeToCoreSchemaType(schema)).toBe(CoreSchemaType.String)
	})

	it("should handle ZodDefault", () => {
		const schema = z.string().default("default value")
		expect(zodTypeToCoreSchemaType(schema)).toBe(CoreSchemaType.String)
	})

	it("should handle markdown", () => {
		const schema = Markdown.create()
		expect(zodTypeToCoreSchemaType(schema)).toBe(CoreSchemaType.String)
	})
})
