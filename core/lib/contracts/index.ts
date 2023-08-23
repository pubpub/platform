import { initContract } from "@ts-rest/core";

import { pubApi } from "./resources/pub";
import { autosuggestApi } from "./resources/autosuggest";

const contract = initContract();

export const api = contract.router({
	/**
	 * Pub API
	 */
	pub: pubApi,
	/**
	 * Members API
	 */
	autosuggest: autosuggestApi,
});
