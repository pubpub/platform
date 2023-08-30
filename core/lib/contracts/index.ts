import { initContract } from "@ts-rest/core";
import { integrationsApi } from "./resources/integrations";

const contract = initContract();

export const api = contract.router({
	/**
	 * integrations API
	 */
	integrations: integrationsApi,
});
