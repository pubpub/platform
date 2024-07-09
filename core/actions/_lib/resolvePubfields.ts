import { z } from "zod";
import {db} from '~/kysely/database'
import type { PubsId } from "~/kysely/types/public/Pubs";
import { getPub } from "~/lib/server";

const pubFieldsSchema = z
	.object({
		pubFields: z.record(z.string(), z.string().array()).optional(),
	})
	.passthrough();

/**
 * @throws {Error} if the pubfields are invalid, i.e. if they are not `Record<string, string[]>`
 */
export const resolveWithPubfields = <T extends Record<string, any>>(argsOrConfig: T, pub: ReturnType<typeof getPub>) => {

	const parsedConfig = pubFieldsSchema.safeParse(argsOrConfig);
	if (!parsedConfig.success) {
		throw new Error(`Invalid pubfields ${argsOrConfig?.pubFields}: ${parsedConfig.error}`);
	}

    const {pubFields, ...rest} = parsedConfig.data

	if (!pubFields) {
		return rest
	}

    const pubFieldsMatchingArgs = Object.entries(pubFields).filter(([key, value]) => rest[key] !== undefined && value)

    const pubValues = await db.selectFrom("pub_values").selectAll().where()

};
