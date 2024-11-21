import { initTsrReactQuery } from "@ts-rest/react-query/v5";

import { siteApi } from "contracts";

import { env } from "./env/env.mjs";

export const client = initTsrReactQuery(siteApi, {
	baseUrl: env.PUBPUB_URL,
});
