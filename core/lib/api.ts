import { initTsrReactQuery } from "@ts-rest/react-query/v5";

import { clientApi } from "contracts";

import { env } from "./env/env";

export const client = initTsrReactQuery(clientApi, {
	baseUrl: typeof window === "undefined" ? env.PUBPUB_URL : window.location.origin,
});
