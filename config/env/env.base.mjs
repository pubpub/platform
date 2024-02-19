// @ts-check

/**
 * This is an `.mjs` file as that makes it easier to import it in `next.config.mjs`
 * You cannot import `.ts` files there
 */

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		API_KEY: z.string(),
	},
	runtimeEnvStrict: {
		API_KEY: process.env.API_KEY,
	},
	emptyStringAsUndefined: true,
	clientPrefix: "NEXT_PUBLIC_",
	client: {},
});
