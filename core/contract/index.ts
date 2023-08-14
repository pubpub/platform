import { initContract } from "@ts-rest/core";

import { pubApi } from "./resources/pubs";

const c = initContract();

export const api = c.router({
	pubApi,
});