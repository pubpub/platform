import { initContract } from "@ts-rest/core";

import { internalApi } from "./resources/internal";
import { siteApi } from "./resources/site";

export * from "./resources/internal";
export * from "./resources/site";
export * from "./resources/types";

const contract = initContract();

export const api = contract.router({
	/**
	 * integrations API
	 */
	internal: internalApi,
	/**
	 * Site builder API
	 */
	site: siteApi,
});
