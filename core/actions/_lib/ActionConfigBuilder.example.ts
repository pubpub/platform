/**
 * examples of using ActionConfigBuilder with immutable api
 *
 * this file demonstrates various use cases for the action config builder
 * both for backend and frontend usage
 */

import { Action } from "db/public";

import {
	ActionConfigBuilder,
	ActionConfigErrorCode,
	createActionConfigBuilder,
} from "./ActionConfigBuilder";

// ============================================================================
// backend example: validating and interpolating action config in runActionInstance
// ============================================================================

async function exampleBackendUsage() {
	// simulate action instance config from database
	const actionInstanceConfig = {
		url: "{{ $.submissionUrl }}",
		method: "POST",
		body: '{ "title": "{{ $.title }}", "authors": {{ $.authors }} }',
	};

	// simulate default config from community settings
	const defaultConfig = {
		method: "GET",
		response: "json",
	};

	// simulate pub values for interpolation
	const pubValues = {
		submissionUrl: "https://api.example.com/submissions",
		title: "My Research Paper",
		authors: ["Alice", "Bob"],
	};

	// create builder and validate/interpolate (immutable chain)
	const builder = await new ActionConfigBuilder(Action.http)
		.withDefaults(defaultConfig)
		.withConfig(actionInstanceConfig)
		.validate()
		.interpolate(pubValues)
		.then((b) => b.validate());

	const result = builder.getResult();

	if (!result.success) {
		// handle different error types
		switch (result.error.code) {
			case ActionConfigErrorCode.ACTION_NOT_FOUND:
				console.error("Action not found:", result.error.message);
				break;
			case ActionConfigErrorCode.INVALID_RAW_CONFIG:
				console.error("Invalid config structure:", result.error.zodError?.issues);
				break;
			case ActionConfigErrorCode.INTERPOLATION_FAILED:
				console.error("Failed to interpolate:", result.error.cause);
				break;
			case ActionConfigErrorCode.INVALID_INTERPOLATED_CONFIG:
				console.error(
					"Interpolated config doesn't match schema:",
					result.error.zodError?.issues
				);
				break;
		}
		return;
	}

	console.log("Final config:", result.config);
	// output: { url: 'https://api.example.com/submissions', method: 'POST', ... }
}

// ============================================================================
// frontend example: validating action config in real-time as user types
// ============================================================================

async function exampleFrontendValidation() {
	// step 1: set defaults from community and user config
	const userConfig = {
		url: "{{ $.dynamicUrl }}",
		method: "POST",
	};

	const builder = createActionConfigBuilder(Action.http)
		.withDefaults({ response: "json" })
		.withConfig(userConfig)
		.validate();

	if (builder.isError()) {
		// show validation error in UI
		const result = builder.getResult();
		if (!result.success) {
			console.error("Config validation error:", result.error.zodError?.issues);
		}
		return;
	}

	// config is valid (template strings are ok at this stage)
	console.log("Config is valid");

	// step 2: user wants to test the action with sample data
	const sampleData = {
		dynamicUrl: "https://test.example.com",
	};

	const testBuilder = await builder.interpolate(sampleData).then((b) => b.validate());

	if (testBuilder.isError()) {
		const result = testBuilder.getResult();
		if (!result.success) {
			console.error("Interpolation or validation failed:", result.error.message);
		}
		return;
	}

	console.log("Ready to run action with config:", testBuilder.unwrap());
}

// ============================================================================
// incremental validation example
// ============================================================================

async function exampleIncrementalValidation() {
	// check if defaults alone make a valid config
	const builder1 = createActionConfigBuilder(Action.http)
		.withDefaults({ method: "GET", response: "json" })
		.validateWithDefaults();

	// this will fail because 'url' is required
	console.log("Defaults alone valid?", builder1.isSuccess()); // false

	// add the config
	const builder2 = builder1.withConfig({ url: "https://example.com" }).validateWithDefaults();

	console.log("With defaults valid?", builder2.isSuccess()); // true

	// override a value and do final validation
	const builder3 = builder2.withOverrides({ method: "POST" }).validate();

	console.log("Final config:", builder3.isSuccess() ? builder3.unwrap() : "invalid");
	// output: { url: 'https://example.com', method: 'POST', response: 'json' }
}

// ============================================================================
// error handling with clear codes
// ============================================================================

async function exampleErrorHandling() {
	const builder = await new ActionConfigBuilder(Action.http)
		.withConfig({
			url: "{{ $.url }}",
			method: "{{ $.method }}",
		})
		.validate()
		.interpolate({
			url: "https://example.com",
			method: "INVALID_METHOD", // not in enum
		})
		.then((b) => b.validate());

	const result = builder.getResult();

	if (!result.success) {
		// clear error codes for handling
		switch (result.error.code) {
			case ActionConfigErrorCode.INVALID_INTERPOLATED_CONFIG:
				// we know the interpolation worked, but the result doesn't match schema
				console.error("Type mismatch after interpolation");
				// zodError has detailed info about what field failed
				console.error(result.error.zodError?.issues);
				break;
			case ActionConfigErrorCode.INTERPOLATION_FAILED:
				// interpolation itself failed (missing data, bad jsonata expression)
				console.error("Interpolation error:", result.error.cause);
				break;
			default:
				console.error("Other error:", result.error.message);
		}
	}
}

// ============================================================================
// step-by-step validation example
// ============================================================================

async function exampleStepByStep() {
	// step 1: add config and validate structure
	const builder1 = createActionConfigBuilder(Action.http)
		.withConfig({
			url: "{{ $.baseUrl }}/api/{{ $.endpoint }}",
			method: "POST",
		})
		.validate();

	if (builder1.isError()) {
		return console.error("Invalid config structure");
	}

	console.log("✓ Config structure is valid");

	// step 2: interpolate
	const builder2 = await builder1.interpolate({
		baseUrl: "https://api.example.com",
		endpoint: "submissions",
	});

	if (builder2.isError()) {
		return console.error("Interpolation failed");
	}

	console.log("✓ Interpolation successful");
	console.log("Interpolated config:", builder2.getResult());

	// step 3: validate final
	const builder3 = builder2.validate();

	if (builder3.isError()) {
		return console.error("Final validation failed");
	}

	console.log("✓ Final config is valid");
	console.log("Ready to use:", builder3.unwrap());
}

// ============================================================================
// usage in runActionInstance (simplified)
// ============================================================================

async function exampleRunActionInstanceIntegration(
	actionName: Action,
	actionInstanceConfig: Record<string, any>,
	defaultConfig: Record<string, any>,
	pubValues: unknown
) {
	// build and validate config
	const builder = await new ActionConfigBuilder(actionName)
		.withDefaults(defaultConfig)
		.withConfig(actionInstanceConfig)
		.validate()
		.interpolate(pubValues)
		.then((b) => b.validate());

	const result = builder.getResult();

	if (!result.success) {
		// return error with clear code
		return {
			error: result.error.message,
			code: result.error.code,
			details: result.error.zodError?.issues,
		};
	}

	// config is validated and ready to use
	const validatedConfig = result.config;

	// proceed with action execution
	console.log("Running action with validated config:", validatedConfig);

	return { success: true, config: validatedConfig };
}
