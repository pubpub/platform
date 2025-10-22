import { describe, expect, test } from "vitest";

import { Action } from "db/public";

import {
	ActionConfigBuilder,
	ActionConfigErrorCode,
	createActionConfigBuilder,
} from "./ActionConfigBuilder";

describe("ActionConfigBuilder", () => {
	describe("basic usage", () => {
		test("creates builder for valid action", () => {
			const builder = new ActionConfigBuilder(Action.http);
			expect(builder).toBeDefined();
			expect(builder.getSchema()).toBeDefined();
		});

		test("handles invalid action", () => {
			const builder = new ActionConfigBuilder("invalid_action" as Action);
			const result = builder.getResult();
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe(ActionConfigErrorCode.ACTION_NOT_FOUND);
			}
		});

		test("convenience function creates builder", () => {
			const builder = createActionConfigBuilder(Action.http);
			expect(builder).toBeInstanceOf(ActionConfigBuilder);
		});
	});

	describe("immutability", () => {
		test("withDefaults returns new instance", () => {
			const builder1 = new ActionConfigBuilder(Action.http);
			const builder2 = builder1.withDefaults({ method: "GET" });
			expect(builder1).not.toBe(builder2);
			expect(builder1.getMergedConfig()).toEqual({});
			expect(builder2.getMergedConfig()).toEqual({ method: "GET" });
		});

		test("withConfig returns new instance", () => {
			const builder1 = new ActionConfigBuilder(Action.http);
			const builder2 = builder1.withConfig({ url: "https://example.com" });
			expect(builder1).not.toBe(builder2);
		});

		test("validate returns new instance", () => {
			const builder1 = new ActionConfigBuilder(Action.http).withConfig({
				url: "https://example.com",
			});
			const builder2 = builder1.validate();
			expect(builder1).not.toBe(builder2);
			expect(builder1.getState()).toBe("initial");
			expect(builder2.getState()).toBe("validated");
		});
	});

	describe("config merging", () => {
		test("merges defaults, config, and overrides correctly", () => {
			const builder = new ActionConfigBuilder(Action.http)
				.withDefaults({ method: "GET", response: "json" })
				.withConfig({ url: "https://example.com" })
				.withOverrides({ method: "POST" });

			const merged = builder.getMergedConfig();
			expect(merged).toEqual({
				method: "POST", // override wins
				response: "json",
				url: "https://example.com",
			});
		});
	});

	describe("validation", () => {
		test("validates correct config", () => {
			const builder = new ActionConfigBuilder(Action.http)
				.withConfig({ url: "https://example.com", method: "GET" })
				.validate();

			const result = builder.getResult();
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.config.url).toBe("https://example.com");
				expect(result.config.method).toBe("GET");
			}
		});

		test("rejects invalid config", () => {
			const builder = new ActionConfigBuilder(Action.http)
				.withConfig({ url: "not-a-url", method: "INVALID" })
				.validate();

			const result = builder.getResult();
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe(ActionConfigErrorCode.INVALID_RAW_CONFIG);
				expect(result.error.zodError).toBeDefined();
			}
		});

		test("accepts json template strings in fields", () => {
			const builder = new ActionConfigBuilder(Action.http)
				.withConfig({
					url: "{{ $.dynamicUrl }}",
					method: "POST",
				})
				.validate();

			const result = builder.getResult();
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.config.url).toBe("{{ $.dynamicUrl }}");
			}
		});

		test("accepts json template for enum fields", () => {
			const builder = new ActionConfigBuilder(Action.http)
				.withConfig({
					url: "https://example.com",
					method: "{{ $.httpMethod }}",
				})
				.validate();

			expect(builder.isSuccess()).toBe(true);
		});

		test("chaining validation preserves result", () => {
			const builder = new ActionConfigBuilder(Action.http)
				.withConfig({ url: "https://example.com", method: "GET" })
				.validate()
				.validate(); // second validate should return same result

			expect(builder.getState()).toBe("validated");
			expect(builder.isSuccess()).toBe(true);
		});
	});

	describe("validateWithDefaults", () => {
		test("validates with defaults making optional fields partial", () => {
			const builder = new ActionConfigBuilder(Action.http)
				.withDefaults({ method: "GET", response: "json" })
				.withConfig({
					url: "https://example.com",
				})
				.validateWithDefaults();

			const result = builder.getResult();
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.config.method).toBe("GET");
				expect(result.config.url).toBe("https://example.com");
			}
		});

		test("still requires non-defaulted required fields", () => {
			const builder = new ActionConfigBuilder(Action.http)
				.withDefaults({ method: "GET" })
				.validateWithDefaults();

			const result = builder.getResult();
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe(ActionConfigErrorCode.INVALID_CONFIG_WITH_DEFAULTS);
			}
		});
	});

	describe("interpolation", () => {
		test("interpolates simple string template", async () => {
			const builder = await new ActionConfigBuilder(Action.http)
				.withConfig({
					url: "{{ $.baseUrl }}",
					method: "GET",
				})
				.validate()
				.interpolate({
					baseUrl: "https://api.example.com",
				});

			const result = builder.getResult();
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.config.url).toBe("https://api.example.com");
			}
		});

		test("interpolates multiple fields", async () => {
			const builder = await new ActionConfigBuilder(Action.http)
				.withConfig({
					url: "{{ $.url }}",
					method: "{{ $.method }}",
				})
				.validate()
				.interpolate({
					url: "https://example.com",
					method: "POST",
				});

			const result = builder.getResult();
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.config.url).toBe("https://example.com");
				expect(result.config.method).toBe("POST");
			}
		});

		test("handles complex jsonata expressions", async () => {
			const builder = await new ActionConfigBuilder(Action.http)
				.withConfig({
					url: "{{ $uppercase($.domain) }}",
					method: "GET",
				})
				.validate()
				.interpolate({
					domain: "https://example.com",
				});

			const result = builder.getResult();
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.config.url).toBe("HTTPS://EXAMPLE.COM");
			}
		});

		test("handles object construction in body", async () => {
			const builder = await new ActionConfigBuilder(Action.http)
				.withConfig({
					url: "https://example.com",
					method: "POST",
					body: '{ "title": "{{ $.title }}", "count": {{ $.count }} }',
				})
				.validate()
				.interpolate({
					title: "Test Title",
					count: 42,
				});

			const result = builder.getResult();
			expect(result.success).toBe(true);
			if (result.success) {
				// body should be a JSON string
				const body = JSON.parse(result.config.body);
				expect(body.title).toBe("Test Title");
				expect(body.count).toBe(42);
			}
		});

		test("returns error on interpolation failure", async () => {
			const builder = await new ActionConfigBuilder(Action.http)
				.withConfig({
					url: "{{ $.missingField }}",
					method: "GET",
				})
				.validate()
				.interpolate({}); // missing field

			expect(builder.isError()).toBe(true);
			const result = builder.getResult();
			if (!result.success) {
				expect(result.error.code).toBe(ActionConfigErrorCode.INTERPOLATION_FAILED);
			}
		});

		test("can chain interpolation", async () => {
			const builder = await new ActionConfigBuilder(Action.http)
				.withConfig({
					url: "{{ $.url }}",
					method: "GET",
				})
				.interpolate({
					url: "https://example.com",
				});

			expect(builder.getState()).toBe("interpolated");
			expect(builder.isSuccess()).toBe(true);
		});
	});

	describe("validation after interpolation", () => {
		test("validates interpolated config matches original schema", async () => {
			const builder = await new ActionConfigBuilder(Action.http)
				.withConfig({
					url: "{{ $.url }}",
					method: "GET",
				})
				.validate()
				.interpolate({
					url: "https://example.com",
				})
				.then((b) => b.validate());

			expect(builder.isSuccess()).toBe(true);
		});

		test("catches type mismatches after interpolation", async () => {
			const builder = await new ActionConfigBuilder(Action.http)
				.withConfig({
					url: "{{ $.url }}",
					method: "{{ $.method }}",
				})
				.validate()
				.interpolate({
					url: "https://example.com",
					method: "INVALID_METHOD",
				})
				.then((b) => b.validate());

			expect(builder.isError()).toBe(true);
			const result = builder.getResult();
			if (!result.success) {
				expect(result.error.code).toBe(ActionConfigErrorCode.INVALID_INTERPOLATED_CONFIG);
				expect(result.error.zodError).toBeDefined();
			}
		});

		test("can call validate multiple times", async () => {
			const builder = await new ActionConfigBuilder(Action.http)
				.withConfig({
					url: "{{ $.url }}",
					method: "GET",
				})
				.interpolate({
					url: "https://example.com",
				})
				.then((b) => b.validate())
				.then((b) => b.validate()); // second validate should be idempotent

			expect(builder.isSuccess()).toBe(true);
		});
	});

	describe("fluent api", () => {
		test("allows chaining methods", async () => {
			const builder = await new ActionConfigBuilder(Action.http)
				.withDefaults({ response: "json" })
				.withConfig({ url: "{{ $.url }}", method: "GET" })
				.withOverrides({ method: "POST" })
				.validate()
				.interpolate({ url: "https://example.com" })
				.then((b) => b.validate());

			const result = builder.getResult();
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.config.method).toBe("POST");
				expect(result.config.url).toBe("https://example.com");
			}
		});

		test("can get result at any point in chain", () => {
			const builder1 = new ActionConfigBuilder(Action.http).withConfig({
				url: "https://example.com",
			});
			const result1 = builder1.getResult();
			expect(result1.success).toBe(true);

			const builder2 = builder1.validate();
			const result2 = builder2.getResult();
			expect(result2.success).toBe(true);
		});
	});

	describe("getter methods", () => {
		test("getResult returns current result", () => {
			const builder = new ActionConfigBuilder(Action.http)
				.withConfig({ url: "https://example.com", method: "GET" })
				.validate();

			const result = builder.getResult();
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.config.url).toBe("https://example.com");
			}
		});

		test("unwrap returns config or throws", () => {
			const validBuilder = new ActionConfigBuilder(Action.http)
				.withConfig({ url: "https://example.com", method: "GET" })
				.validate();

			expect(() => validBuilder.unwrap()).not.toThrow();
			expect(validBuilder.unwrap().url).toBe("https://example.com");

			const invalidBuilder = new ActionConfigBuilder(Action.http)
				.withConfig({ url: "not-a-url" })
				.validate();

			expect(() => invalidBuilder.unwrap()).toThrow();
		});

		test("unwrapOr returns config or default", () => {
			const validBuilder = new ActionConfigBuilder(Action.http)
				.withConfig({ url: "https://example.com", method: "GET" })
				.validate();

			expect(validBuilder.unwrapOr(null)).toEqual(
				expect.objectContaining({ url: "https://example.com" })
			);

			const invalidBuilder = new ActionConfigBuilder(Action.http)
				.withConfig({ url: "not-a-url" })
				.validate();

			expect(invalidBuilder.unwrapOr(null)).toBeNull();
			expect(invalidBuilder.unwrapOr({ fallback: true })).toEqual({ fallback: true });
		});

		test("isSuccess and isError work correctly", () => {
			const validBuilder = new ActionConfigBuilder(Action.http)
				.withConfig({ url: "https://example.com", method: "GET" })
				.validate();

			expect(validBuilder.isSuccess()).toBe(true);
			expect(validBuilder.isError()).toBe(false);

			const invalidBuilder = new ActionConfigBuilder(Action.http)
				.withConfig({ url: "not-a-url" })
				.validate();

			expect(invalidBuilder.isSuccess()).toBe(false);
			expect(invalidBuilder.isError()).toBe(true);
		});

		test("getState returns current state", async () => {
			const builder1 = new ActionConfigBuilder(Action.http);
			expect(builder1.getState()).toBe("initial");

			const builder2 = builder1
				.withConfig({ url: "https://example.com", method: "GET" })
				.validate();
			expect(builder2.getState()).toBe("validated");

			const builder3 = await builder2.interpolate({});
			expect(builder3.getState()).toBe("interpolated");
		});
	});

	describe("error propagation", () => {
		test("errors propagate through chain", () => {
			const builder = new ActionConfigBuilder(Action.http)
				.withConfig({ url: "not-a-url" })
				.validate()
				.withOverrides({ method: "POST" }); // this should still have error

			expect(builder.isError()).toBe(true);
		});

		test("early errors prevent further operations", async () => {
			const builder = await new ActionConfigBuilder(Action.http)
				.withConfig({ url: "not-a-url" })
				.validate()
				.interpolate({ url: "https://example.com" }); // this should not run

			const result = builder.getResult();
			expect(result.success).toBe(false);
			if (!result.success) {
				// should still be the validation error, not interpolation
				expect(result.error.code).toBe(ActionConfigErrorCode.INVALID_RAW_CONFIG);
			}
		});
	});
});
