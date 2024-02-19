// @ts-check

/**
 * This is an `.mjs` file as that makes it easier to import it in `next.config.mjs`
 * You cannot import `.ts` files there
 */

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { env as baseEnv } from "./env.base.mjs";

export const env = createEnv({
	extends: [baseEnv],
	server: {
		PUBPUB_URL: z.string(),
	},
	runtimeEnvStrict: {
		PUBPUB_URL: process.env.API_KEY,
	},
	emptyStringAsUndefined: true,
	clientPrefix: "NEXT_PUBLIC_",
	client: {},
});
