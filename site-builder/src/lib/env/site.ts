import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const SITE_ENV = createEnv({
	server: {
		AUTH_TOKEN: z.string(),
		PUBPUB_URL: z.string().url(),
		COMMUNITY_SLUG: z.string(),
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});
