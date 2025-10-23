import type { ZodError } from "zod";

import { z } from "zod";

import type { Action } from "db/public";
import { interpolate } from "@pubpub/json-interpolate";

import { getActionByName } from "../api";
import { schemaWithJsonFields } from "./schemaWithJsonFields";

// error codes for clear error handling
export enum ActionConfigErrorCode {
	ACTION_NOT_FOUND = "ACTION_NOT_FOUND",
	INVALID_RAW_CONFIG = "INVALID_RAW_CONFIG",
	INVALID_CONFIG_WITH_DEFAULTS = "INVALID_CONFIG_WITH_DEFAULTS",
	INTERPOLATION_FAILED = "INTERPOLATION_FAILED",
	INVALID_INTERPOLATED_CONFIG = "INVALID_INTERPOLATED_CONFIG",
}

export type ActionConfigError = {
	code: ActionConfigErrorCode;
	message: string;
	zodError?: ZodError;
	cause?: unknown;
};

export type ActionConfigSuccess<T = Record<string, any>> = {
	success: true;
	config: T;
};

export type ActionConfigResult<T = Record<string, any>> =
	| ActionConfigSuccess<T>
	| { success: false; error: ActionConfigError };

type BuilderState = "initial" | "validated" | "interpolated";

/**
 * immutable builder for action configurations
 * handles validation, defaults, and interpolation with clear error codes
 *
 * each method returns a new instance, allowing for a functional, chainable api
 *
 * @example
 * ```ts
 * const result = await new ActionConfigBuilder(Action.http)
 *   .withDefaults({ method: 'GET' })
 *   .withConfig({ url: '{{ $.url }}' })
 *   .validate()
 *   .interpolate({ url: 'https://example.com' })
 *   .validate()
 *   .getResult();
 * ```
 */
export class ActionConfigBuilder<TConfig extends z.ZodObject<any> = z.ZodObject<any>> {
	private readonly actionName: Action;
	private readonly action: ReturnType<typeof getActionByName> | null;
	private readonly defaults: Record<string, any>;
	private readonly config: Record<string, any>;
	private readonly overrides: Record<string, any>;
	private readonly state: BuilderState;
	private readonly result: ActionConfigResult | null;

	constructor(
		actionName: Action,
		options: {
			action?: ReturnType<typeof getActionByName> | null;
			defaults?: Record<string, any>;
			config?: Record<string, any>;
			overrides?: Record<string, any>;
			state?: BuilderState;
			result?: ActionConfigResult | null;
		} = {}
	) {
		this.actionName = actionName;
		this.defaults = options.defaults ?? {};
		this.config = options.config ?? {};
		this.overrides = options.overrides ?? {};
		this.state = options.state ?? "initial";
		this.result = options.result ?? null;

		if (options.action !== undefined) {
			this.action = options.action;
		} else {
			try {
				this.action = getActionByName(actionName);
			} catch (error) {
				this.action = null;
				this.result = {
					success: false,
					error: {
						code: ActionConfigErrorCode.ACTION_NOT_FOUND,
						message: `Action ${actionName} not found`,
						cause: error,
					},
				};
			}
		}
	}

	/**
	 * create new instance with default configuration values
	 * these will be merged with the lowest priority
	 */
	withDefaults(defaults: Record<string, any> | string[]): ActionConfigBuilder<TConfig> {
		if (Array.isArray(defaults)) {
			defaults = defaults.reduce(
				(acc, key) => {
					acc[key] = true;
					return acc;
				},
				{} as Record<string, true>
			);
		}
		return new ActionConfigBuilder(this.actionName, {
			action: this.action,
			defaults,
			config: this.config,
			overrides: this.overrides,
			state: this.state,
			result: this.result,
		});
	}

	/**
	 * create new instance with main configuration
	 * this typically comes from the action instance
	 */
	withConfig(config: Record<string, any>): ActionConfigBuilder<TConfig> {
		return new ActionConfigBuilder(this.actionName, {
			action: this.action,
			defaults: this.defaults,
			config,
			overrides: this.overrides,
			state: this.state,
			result: this.result,
		});
	}

	/**
	 * create new instance with override values
	 * these will be merged with the highest priority
	 */
	withOverrides(overrides: Record<string, any>): ActionConfigBuilder<TConfig> {
		return new ActionConfigBuilder(this.actionName, {
			action: this.action,
			defaults: this.defaults,
			config: this.config,
			overrides,
			state: this.state,
			result: this.result,
		});
	}

	/**
	 * validate the current configuration
	 *
	 * behavior depends on current state:
	 * - initial: validates raw config (allows templates)
	 * - validated: returns existing validation result
	 * - interpolated: validates interpolated config against original schema
	 */
	validate(): ActionConfigBuilder<TConfig> {
		if (this.result && !this.result.success) {
			return this;
		}

		if (this.state === "validated" && this.result) {
			return this;
		}

		if (this.state === "interpolated") {
			return this.validateInterpolated();
		}

		return this.validateRaw();
	}

	/**
	 * validate with defaults applied
	 * makes fields that have defaults optional
	 */
	validateWithDefaults(): ActionConfigBuilder<TConfig> {
		if (this.result && !this.result.success) {
			return this;
		}

		const schema = this.getSchemaWithJsonFields();
		if (!schema) {
			return new ActionConfigBuilder(this.actionName, {
				action: this.action,
				defaults: this.defaults,
				config: this.config,
				overrides: this.overrides,
				state: this.state,
				result: {
					success: false,
					error: {
						code: ActionConfigErrorCode.ACTION_NOT_FOUND,
						message: `Action ${this.actionName} not found`,
					},
				},
			});
		}

		const schemaWithPartialDefaults = schema.partial(
			Object.keys(this.defaults ?? {}).reduce(
				(acc, key) => {
					acc[key] = true;
					return acc;
				},
				{} as Record<string, true>
			)
		);

		const mergedConfig = this.getMergedConfig();
		const parseResult = schemaWithPartialDefaults.safeParse(mergedConfig);

		if (!parseResult.success) {
			return new ActionConfigBuilder(this.actionName, {
				action: this.action,
				defaults: this.defaults,
				config: this.config,
				overrides: this.overrides,
				state: this.state,
				result: {
					success: false,
					error: {
						code: ActionConfigErrorCode.INVALID_CONFIG_WITH_DEFAULTS,
						message: "Invalid configuration with defaults",
						zodError: parseResult.error,
					},
				},
			});
		}

		return new ActionConfigBuilder(this.actionName, {
			action: this.action,
			defaults: this.defaults,
			config: this.config,
			overrides: this.overrides,
			state: "validated",
			result: { success: true, config: parseResult.data },
		});
	}

	/**
	 * interpolate json template strings with actual data
	 *
	 * @param data - data to use for interpolation (e.g., pub values, webhook data)
	 * @returns promise with new builder instance containing interpolated config
	 */
	async interpolate(data: unknown): Promise<ActionConfigBuilder<TConfig>> {
		if (this.result && !this.result.success) {
			return this;
		}

		const configToInterpolate =
			this.result?.success && this.state === "validated"
				? this.result.config
				: this.getMergedConfig();

		try {
			// interpolate each field individually to preserve string types
			const interpolatedConfig: Record<string, any> = {};

			for (const [key, value] of Object.entries(configToInterpolate)) {
				if (typeof value === "string") {
					const interpolated = await interpolate(value, data);
					// if the result is an object but the original was a string field,
					// stringify it back to JSON for fields like body
					interpolatedConfig[key] =
						typeof interpolated === "object"
							? JSON.stringify(interpolated)
							: interpolated;
				} else if (typeof value === "object" && value !== null) {
					// recursively interpolate nested objects
					const valueAsString = JSON.stringify(value);
					const interpolated = await interpolate(valueAsString, data);
					interpolatedConfig[key] =
						typeof interpolated === "string" ? JSON.parse(interpolated) : interpolated;
				} else {
					interpolatedConfig[key] = value;
				}
			}

			return new ActionConfigBuilder(this.actionName, {
				action: this.action,
				defaults: this.defaults,
				config: this.config,
				overrides: this.overrides,
				state: "interpolated",
				result: { success: true, config: interpolatedConfig },
			});
		} catch (error) {
			return new ActionConfigBuilder(this.actionName, {
				action: this.action,
				defaults: this.defaults,
				config: this.config,
				overrides: this.overrides,
				state: this.state,
				result: {
					success: false,
					error: {
						code: ActionConfigErrorCode.INTERPOLATION_FAILED,
						message: "Failed to interpolate configuration",
						cause: error,
					},
				},
			});
		}
	}

	/**
	 * get the action schema
	 * returns null if action not found
	 */
	getSchema(): z.ZodObject<any> | null {
		return this.action?.config.schema ?? null;
	}

	/**
	 * get the schema that accepts json template strings
	 * returns null if action not found
	 */
	getSchemaWithJsonFields(): z.ZodObject<any> | null {
		const schema = this.getSchema();
		if (!schema) {
			return null;
		}
		return schemaWithJsonFields(schema);
	}

	/**
	 * get the current merged config (before validation)
	 */
	getMergedConfig(): Record<string, any> {
		return {
			...this.defaults,
			...this.config,
			...this.overrides,
		};
	}

	/**
	 * get the current result
	 * returns the validation or interpolation result if available
	 */
	getResult(): ActionConfigResult {
		if (this.result) {
			return this.result;
		}

		// if no result yet, return the merged config as success
		return { success: true, config: this.getMergedConfig() };
	}

	/**
	 * get the current config if successful, throw if error
	 * useful for when you know the config should be valid
	 */
	unwrap(): Record<string, any> {
		const result = this.getResult();
		if (!result.success) {
			throw new Error(
				`Cannot unwrap failed config: ${result.error.code} - ${result.error.message}`
			);
		}
		return result.config;
	}

	/**
	 * get the current config if successful, return null if error
	 */
	unwrapOr(defaultValue: Record<string, any> | null = null): Record<string, any> | null {
		const result = this.getResult();
		return result.success ? result.config : defaultValue;
	}

	/**
	 * check if the current state is successful
	 */
	isSuccess(): boolean {
		const result = this.getResult();
		return result.success;
	}

	/**
	 * check if the current state is an error
	 */
	isError(): boolean {
		return !this.isSuccess();
	}

	/**
	 * get the current state
	 */
	getState(): BuilderState {
		return this.state;
	}

	// private helper methods

	private validateRaw(): ActionConfigBuilder<TConfig> {
		const schema = this.getSchemaWithJsonFields();
		if (!schema) {
			return new ActionConfigBuilder(this.actionName, {
				action: this.action,
				defaults: this.defaults,
				config: this.config,
				overrides: this.overrides,
				state: this.state,
				result: {
					success: false,
					error: {
						code: ActionConfigErrorCode.ACTION_NOT_FOUND,
						message: `Action ${this.actionName} not found`,
					},
				},
			});
		}

		const mergedConfig = this.getMergedConfig();
		const parseResult = schema.safeParse(mergedConfig);

		if (!parseResult.success) {
			return new ActionConfigBuilder(this.actionName, {
				action: this.action,
				defaults: this.defaults,
				config: this.config,
				overrides: this.overrides,
				state: this.state,
				result: {
					success: false,
					error: {
						code: ActionConfigErrorCode.INVALID_RAW_CONFIG,
						message: "Invalid raw configuration",
						zodError: parseResult.error,
					},
				},
			});
		}

		return new ActionConfigBuilder(this.actionName, {
			action: this.action,
			defaults: this.defaults,
			config: this.config,
			overrides: this.overrides,
			state: "validated",
			result: { success: true, config: parseResult.data },
		});
	}

	private validateInterpolated(): ActionConfigBuilder<TConfig> {
		if (!this.result || !this.result.success) {
			return new ActionConfigBuilder(this.actionName, {
				action: this.action,
				defaults: this.defaults,
				config: this.config,
				overrides: this.overrides,
				state: this.state,
				result: {
					success: false,
					error: {
						code: ActionConfigErrorCode.INTERPOLATION_FAILED,
						message: "No interpolated config available",
					},
				},
			});
		}

		const schema = this.getSchema();
		if (!schema) {
			return new ActionConfigBuilder(this.actionName, {
				action: this.action,
				defaults: this.defaults,
				config: this.config,
				overrides: this.overrides,
				state: this.state,
				result: {
					success: false,
					error: {
						code: ActionConfigErrorCode.ACTION_NOT_FOUND,
						message: `Action ${this.actionName} not found`,
					},
				},
			});
		}

		const parseResult = schema.safeParse(this.result.config);

		if (!parseResult.success) {
			return new ActionConfigBuilder(this.actionName, {
				action: this.action,
				defaults: this.defaults,
				config: this.config,
				overrides: this.overrides,
				state: this.state,
				result: {
					success: false,
					error: {
						code: ActionConfigErrorCode.INVALID_INTERPOLATED_CONFIG,
						message: "Invalid interpolated configuration",
						zodError: parseResult.error,
					},
				},
			});
		}

		return new ActionConfigBuilder(this.actionName, {
			action: this.action,
			defaults: this.defaults,
			config: this.config,
			overrides: this.overrides,
			state: this.state,
			result: { success: true, config: parseResult.data },
		});
	}
}

/**
 * convenience function to create a builder
 */
export const createActionConfigBuilder = (actionName: Action) => {
	return new ActionConfigBuilder(actionName);
};
