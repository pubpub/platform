import { initContract } from "@ts-rest/core";

import { pubApi } from "./resources/pub";
import { autosuggestApi } from "./resources/autosuggestion";

const c = initContract();

export const api = c.router({
	/**
	 * Pub API
	 */
	pub: pubApi,
	/**
	 * Members API
	 */
	autosuggest: autosuggestApi,
});