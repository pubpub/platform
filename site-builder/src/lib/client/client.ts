import type { InitClientArgs } from "@ts-rest/core";

import { initClient } from "@ts-rest/core";

import { siteApi } from "contracts";

let client: ReturnType<typeof initClient<typeof siteApi, InitClientArgs>>;

export const getClient = () => {
	if (!client) {
		client = initClient(siteApi, {
			baseUrl: `${import.meta.env.PUBPUB_URL}`,
			baseHeaders: {
				Authorization: `Bearer ${import.meta.env.AUTH_TOKEN}`,
			},
		});
	}

	return client;
};
