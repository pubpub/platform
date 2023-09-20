import { initClient } from "@ts-rest/core";
import {
	CreatePubRequestBody,
	CreatePubResponseBody,
	GetPubResponseBody,
	UpdatePubRequestBody,
	UpdatePubResponseBody,
	User,
	api,
} from "contracts";
import { Manifest, ManifestJson } from "./manifest";

/**
 * Derive a union of readable keys from a manifest.
 */
export type ReadableKey<T extends Manifest> =
	| WritableKey<T>
	| Extract<T["read"] extends "*" ? string : keyof T["read"], string>;

/**
 * Derive a union of writable keys from a manifest.
 */
export type WritableKey<T extends Manifest> = Extract<
	Extract<
		| keyof T["register"]
		// If `write` is `"*"`, then all fields are writable, so any field name is
		// valid.
		| (T["write"] extends "*" ? string : keyof T["write"]),
		string
	>,
	string
>;

/**
 * TypeScript infers the type of `"*"` as `string` when importing from a
 * JSON module. This is a utility type that converts `string` back to `"*"`,
 * since that is the only case a string would be used as the value of `write`
 * or `read`.
 */
export type Parse<T extends ManifestJson> = {
	[K in Extract<keyof T, "read" | "write">]: T[K] extends string ? "*" : T[K];
} & { [K in Extract<keyof T, "register">]: T[K] } & { url: string };

/**
 * Payload used to create a pub.
 */
export type CreatePayload<T extends Manifest> = {
	[K in WritableKey<T>]: unknown;
};

/**
 * Expected response from creating a pub.
 */
export type CreateResponse<T extends Manifest> = CreatePayload<T>;

/**
 * Payload used to get part of a pub.
 */
export type ReadPayload<T extends Manifest> = ReadableKey<T>[];

/**
 * Expected response from getting part of a pub.
 */
export type ReadResponse<T extends string[]> = {
	// TODO(3mcd): value types should be inferred from manifest
	[K in T[number]]: unknown;
};

/**
 * Payload used to update part of a pub.
 */
export type UpdatePayload<T extends Manifest> = {
	[K in WritableKey<T>]?: unknown;
};

/**
 * Expected response from updating part of a pub.
 */
export type UpdateResponse<U extends UpdatePayload<Manifest>> = {
	[K in keyof U]: unknown;
};

export type Client<T extends Manifest> = {
	auth(instanceId: string, token: string): Promise<User>;
	createPub(instanceId: string, pub: CreatePubRequestBody): Promise<CreatePubResponseBody>;
	getPub(instanceId: string, pubId: string): Promise<GetPubResponseBody>;
	updatePub(instanceId: string, pub: UpdatePubRequestBody): Promise<UpdatePubResponseBody>;
};

/**
 * Create a client for the PubPub API.
 */
export const makeClient = <T extends Manifest>(manifest: T): Client<T> => {
	const client = initClient(api.integrations, {
		baseUrl: manifest.url,
		baseHeaders: {},
	});
	return {
		async auth(instanceId, token) {
			try {
				const response = await client.auth({
					headers: {
						authorization: `Bearer ${token}`,
					},
					params: { instanceId },
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to authenticate user or integration", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async createPub(instanceId, pub) {
			try {
				const response = await client.createPub({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: { instanceId },
					body: pub,
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to create pub", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async getPub(instanceId, pubId) {
			try {
				const response = await client.getPub({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: { instanceId, pubId },
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to get pub", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async updatePub(instanceId, pub) {
			try {
				const response = await client.updatePub({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: { instanceId, pubId: pub.id },
					body: pub,
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to update pub", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
	};
};
