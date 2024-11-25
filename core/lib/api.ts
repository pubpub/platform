import { initTsrReactQuery } from "@ts-rest/react-query/v5";

import { siteApi } from "contracts";

export const client = initTsrReactQuery(siteApi, {
	baseUrl: window.location.origin,
});
