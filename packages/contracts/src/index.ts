import { initContract } from "@ts-rest/core";

import { integrationsApi } from "./resources/integrations";
import { internalApi } from "./resources/internal";

export * from "./resources/integrations";
export * from "./resources/internal";

const contract = initContract();

export const api = contract.router({
	/**
	 * integrations API
	 */
	integrations: integrationsApi,
	internal: internalApi,
});
