// @ts-check

import { createEnv } from "@t3-oss/env-nextjs";
import { isBuilding } from "utils";
import { z } from "zod";

export const env = createEnv({
	shared: {
		NODE_ENV: z.enum(["development", "production", "test"]),
	},
	server: {
		API_KEY: z.string(),
		PUBPUB_URL: z.string().url(),
	},
	experimental__runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
	},
	emptyStringAsUndefined: true,
	skipValidation: Boolean(process.env.CI),
	client: {},
});
