import { initClient } from "@ts-rest/core";

import { makeClient } from "@pubpub/sdk";
import { api } from "contracts";

export const integrationClient = makeClient({});
export type IntegrationClient = typeof integrationClient;

export const internalClient = initClient(api.internal, {
	baseUrl: `${process.env.PUBPUB_URL}/api/v0`,
	baseHeaders: { authorization: `Bearer ${process.env.API_KEY}` },
	jsonQuery: true,
});
export type InternalClient = typeof internalClient;

export const clients = {
	integrationClient,
	internalClient,
} as const;

export type Clients = typeof clients;
export type Client = Clients[keyof Clients];
