import { initContract } from "@ts-rest/core";

import { pubApi } from "./resources/pubs";
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
