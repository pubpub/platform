import { initContract } from "@ts-rest/core";

import { pubApi } from "./resources/pubs";
import {  memberApi } from "./resources/members";

const c = initContract();

export const api = c.router({
	/** 
	 * Pub API
	*/
	pubs: pubApi,
	/**
	 * Members API
	 */
	members: memberApi
});