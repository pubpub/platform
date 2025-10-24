import { describe, expect, test } from "vitest";
import * as z from "zod";

import { schemaWithJsonFields } from "./schemaWithJsonFields";

describe("schemaWithJsonFields", () => {
	test("accepts original type", () => {
		const schema = z.object({
			name: z.string(),
			age: z.number(),
		});

		const wrapped = schemaWithJsonFields(schema);

		const result = wrapped.parse({
			name: "John",
			age: 30,
		});

		expect(result).toEqual({
			name: "John",
			age: 30,
		});
	});

	test("accepts template string for string field", () => {
		const schema = z.object({
			name: z.string(),
		});

		const wrapped = schemaWithJsonFields(schema);

		const result = wrapped.parse({
			name: `"{{ $.userName }}"`,
		});

		expect(result).toEqual({
			name: `"{{ $.userName }}"`,
		});
	});

	test("accepts template string for number field", () => {
		const schema = z.object({
			age: z.number(),
		});

		const wrapped = schemaWithJsonFields(schema);

		const result = wrapped.parse({
			age: `"{{ $.userAge }}"`,
		});

		expect(result).toEqual({
			age: `"{{ $.userAge }}"`,
		});
	});

	test("accepts template string for enum field", () => {
		const schema = z.object({
			method: z.enum(["GET", "POST", "PUT", "DELETE"]),
		});

		const wrapped = schemaWithJsonFields(schema);

		const result = wrapped.parse({
			method: "{{ $.httpMethod }}",
		});

		expect(result).toEqual({
			method: "{{ $.httpMethod }}",
		});
	});

	test("handles optional fields", () => {
		const schema = z.object({
			name: z.string().optional(),
		});

		const wrapped = schemaWithJsonFields(schema);

		const result1 = wrapped.parse({
			name: "John",
		});
		expect(result1).toEqual({ name: "John" });

		const result2 = wrapped.parse({
			name: "{{ $.name }}",
		});
		expect(result2).toEqual({ name: "{{ $.name }}" });

		const result3 = wrapped.parse({});
		expect(result3).toEqual({});
	});

	test("handles default values", () => {
		const schema = z.object({
			method: z.enum(["GET", "POST"]).default("GET"),
		});

		const wrapped = schemaWithJsonFields(schema);

		const result1 = wrapped.parse({});
		expect(result1).toEqual({ method: "GET" });

		const result2 = wrapped.parse({
			method: "{{ $.method }}",
		});
		expect(result2).toEqual({ method: "{{ $.method }}" });
	});

	test("rejects non-template strings for non-string types", () => {
		const schema = z.object({
			age: z.number(),
		});

		const wrapped = schemaWithJsonFields(schema);

		expect(() =>
			wrapped.parse({
				age: "not a template",
			})
		).toThrow();
	});

	test("handles url validation", () => {
		const schema = z.object({
			url: z.string().url(),
		});

		const wrapped = schemaWithJsonFields(schema);

		const result1 = wrapped.parse({
			url: "https://example.com",
		});
		expect(result1).toEqual({ url: "https://example.com" });

		const result2 = wrapped.parse({
			url: "{{ $.endpoint }}",
		});
		expect(result2).toEqual({ url: "{{ $.endpoint }}" });

		expect(() =>
			wrapped.parse({
				url: "not a url",
			})
		).toThrow();
	});

	test("handles email validation", () => {
		const schema = z.object({
			email: z.string().email(),
		});

		const wrapped = schemaWithJsonFields(schema);

		const result1 = wrapped.parse({
			email: "test@example.com",
		});
		expect(result1).toEqual({ email: "test@example.com" });

		const result2 = wrapped.parse({
			email: "{{ $.userEmail }}",
		});
		expect(result2).toEqual({ email: "{{ $.userEmail }}" });
	});

	test("handles complex template expressions", () => {
		const schema = z.object({
			value: z.number(),
		});

		const wrapped = schemaWithJsonFields(schema);

		const result = wrapped.parse({
			value: "{{ $.items[0].price * 1.1 }}",
		});

		expect(result).toEqual({
			value: "{{ $.items[0].price * 1.1 }}",
		});
	});

	test("handles nullable fields", () => {
		const schema = z.object({
			name: z.string().nullable(),
		});

		const wrapped = schemaWithJsonFields(schema);

		const result1 = wrapped.parse({ name: "John" });
		expect(result1).toEqual({ name: "John" });

		const result2 = wrapped.parse({ name: null });
		expect(result2).toEqual({ name: null });

		const result3 = wrapped.parse({ name: "{{ $.name }}" });
		expect(result3).toEqual({ name: "{{ $.name }}" });
	});

	test("handles combined optional and default", () => {
		const schema = z.object({
			count: z.number().optional().default(0),
		});

		const wrapped = schemaWithJsonFields(schema);

		const result1 = wrapped.parse({});
		expect(result1).toEqual({ count: 0 });

		const result2 = wrapped.parse({ count: 5 });
		expect(result2).toEqual({ count: 5 });

		const result3 = wrapped.parse({ count: "{{ $.count }}" });
		expect(result3).toEqual({ count: "{{ $.count }}" });
	});
});
