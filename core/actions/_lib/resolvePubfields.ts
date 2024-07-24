import { z } from "zod";

import type { JsonValue } from "contracts";

import type { getPubCached } from "~/lib/server";

const pubFieldsSchema = z
	.object({
		pubFields: z.record(z.string(), z.string().array()).optional(),
	})
	.passthrough();

/**
 * @throws {Error} if the pubfields are invalid, i.e. if they are not `Record<string, string[]>`
 */
export const resolveWithPubfields = <T extends Record<string, any>>(
	argsOrConfig: T,
	pubValues: Awaited<ReturnType<typeof getPubCached>>["values"]
) => {
	const parsedConfig = pubFieldsSchema.safeParse(argsOrConfig);
	if (!parsedConfig.success) {
		throw new Error(`Invalid pubfields ${argsOrConfig?.pubFields}: ${parsedConfig.error}`);
	}

	const { pubFields, ...rest } = parsedConfig.data;

	if (!pubFields) {
		return rest;
	}

	const pubFieldsMatchingArgs = Object.entries(pubFields).filter(
		([key, value]) => rest[key] !== undefined && value
	);

	const pv = Object.fromEntries(
		pubFieldsMatchingArgs.flatMap(([arg, pubFieldSlugs]) => {
			let value: JsonValue | undefined = undefined;

			for (const slug of pubFieldSlugs) {
				value = pubValues[slug];

				if (value !== undefined) {
					break;
				}
			}

			if (value === undefined) {
				return [] as const;
			}

			return [[arg, value]] as const;
		})
	);

	return {
		...rest,
		...pv,
	};
};
