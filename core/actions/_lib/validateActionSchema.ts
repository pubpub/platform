import type z from "zod";

import type { Action } from "db/public";

import { getActionByName } from "../api";
import { schemaWithJsonFields } from "./schemaWithJsonFields";

/**
 * parses the data with the action config schema, including defaults
 * and allows for json fields
 */
export const parseActionSchema = (
	actionName: Action,
	actionConfig: Record<string, any>,
	defaultConfig: Record<string, any>,
	data: Record<string, any>
) => {
	const action = getActionByName(actionName);

	const schema = schemaWithJsonFields(action.config.schema as z.ZodObject<any>);

	const schemaWithPartialDefaults = schema.partial(
		Object.keys(defaultConfig ?? {}).reduce(
			(acc, key) => {
				acc[key] = true;
				return acc;
			},
			{} as Record<string, true>
		)
	);

	const parsedData = schemaWithPartialDefaults.safeParse({
		...defaultConfig,
		...actionConfig,
		...data,
	});

	if (!parsedData.success) {
		return {
			error: parsedData.error,
		};
	}

	return parsedData.data;
};
