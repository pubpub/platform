import { env as envOriginal } from "~/lib/env/env";

export const env = {
	PUBPUB_URL: "http://localhost:6006",
} satisfies Partial<typeof envOriginal>;
