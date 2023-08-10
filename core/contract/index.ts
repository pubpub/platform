// File defining the contract for the whole API, with all resources created under
// the resources folder
import { initContract } from "@ts-rest/core";

import { posts } from "./resources/posts";
import { pubs } from "./resources/pubs";

const c = initContract();

export const api = c.router({
	posts,
});

export const pubsApi = c.router({
    pubs,
});