import { z } from "zod";

import type { JsonValue, ProcessedPub } from "contracts";

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
	pubValues: ProcessedPub["values"],
	overrides: Set<string>
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
				value = pubValues.find((v) => v.fieldSlug === slug)?.value as JsonValue;

				// FIXME: this treats empty strings as valid values
				// we should investigate whether this is the right behaviour
				if (value !== undefined) {
					break;
				}
			}

			if (value === undefined) {
				return [] as const;
			}

			overrides.add(arg);

			return [[arg, value]] as const;
		})
	);

	return {
		...rest,
		...pv,
	};
};
