import { initTsrReactQuery } from "@ts-rest/react-query/v5";

import { siteApi } from "contracts";

import { env } from "./env/env.mjs";

export const client = initTsrReactQuery(siteApi, {
	baseUrl: env.NEXT_PUBLIC_PUBPUB_URL,
});
