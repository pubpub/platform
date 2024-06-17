import { initClient } from "@ts-rest/core";

import { makeClient } from "@pubpub/sdk";
import { api } from "contracts";

export const integrationClient = makeClient({});
export type IntegrationClient = typeof integrationClient;

export const createInternalClient = (communitySlug: string, apiKey?: string) =>
	initClient(api.internal, {
		baseUrl: `${process.env.PUBPUB_URL}/api/v0/c/${communitySlug}`,
		baseHeaders: { authorization: `Bearer ${apiKey ?? process.env.API_KEY}` },
		jsonQuery: true,
	});

export type InternalClient = ReturnType<typeof createInternalClient>;

export const clients = {
	integrationClient,
} as const;

export type Clients = typeof clients;
export type Client = Clients[keyof Clients];
