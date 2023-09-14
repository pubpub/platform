import { expect } from "utils";
import { IntegrationApiError } from "./errors";
import { Manifest, ManifestJson, User } from "./types";

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
} & { [K in Extract<keyof T, "register">]: T[K] };

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
	/**
	 * Authenticate a user, returning their profile.
	 */
	auth(instanceId: string, token: string): Promise<User>;
	/**
	 * Create a pub using the given pub type id and fields.
	 */
	create(
		instanceId: string,
		pub: CreatePayload<T>,
		pubTypeId: string
	): Promise<CreateResponse<T>>;
	/**
	 * Get part of a pub.
	 */
	read<U extends ReadPayload<T>>(
		instanceId: string,
		pubId: string,
		...fields: U
	): Promise<ReadResponse<U>>;
	/**
	 * Update part of a pub.
	 */
	update<U extends UpdatePayload<T>>(
		instanceId: string,
		pubId: string,
		patch: U
	): Promise<UpdateResponse<U>>;
};

/**
 * Make an HTTP request to the PubPub API.
 */
const makeRequest = async (
	instanceId: string,
	token: string,
	method: "GET" | "POST" | "PATCH",
	path?: string | null | undefined,
	body?: unknown
) => {
	const url = `${process.env.PUBPUB_URL}/api/v0/integrations/${instanceId}${
		path ? `/${path}` : ""
	}`;
	const signal = AbortSignal.timeout(5000);
	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
	};
	let response: Response;
	try {
		response = await fetch(url, {
			method,
			headers,
			signal,
			body: body ? JSON.stringify(body) : undefined,
			cache: "no-store",
		});
	} catch (error) {
		if (error instanceof Error && error.name === "TimeoutError") {
			throw new Error("Failed to reach PubPub within 5 seconds");
		}
		// Some other type of network error occurred.
		throw error;
	}
	if (response.ok) {
		return response.json();
	}
	let message = "Request to PubPub failed";
	switch (response.status) {
		// 400 responses are expected to be Zod validation errors.
		case 400:
			let json: unknown;
			try {
				json = await response.json();
			} catch (error) {
				message = "Expected JSON response";
				break;
			}
			if (typeof json === "object" && json !== null && "name" in json && "issues" in json) {
				switch (json.name) {
					case "ZodError":
						throw new IntegrationApiError("Request contained invalid fields", {
							cause: {
								status: 400,
								issues: json.issues,
							},
						});
					default:
						message = "Invalid request";
						break;
				}
			}
			break;
		case 401:
			message = "User or integration not authenticated";
			break;
		case 403:
			message = "User or integration not authorized";
			break;
		case 404:
			message = "Integration not found";
			break;
	}
	throw new IntegrationApiError(message, { cause: { status: response.status } });
};

/**
 * Create a client for the PubPub API.
 */
export const makeClient = <T extends Manifest>(manifest: T): Client<T> => {
	return {
		async auth(instanceId, token) {
			try {
				const userRaw = await makeRequest(instanceId, token, "GET", "auth");
				const user = {
					...userRaw,
					createdAt: new Date(userRaw.createdAt),
					updatedAt: new Date(userRaw.updatedAt),
				};
				return user;
			} catch (cause) {
				throw new Error("Failed to authenticate user or integration", { cause });
			}
		},
		async create(instanceId, pub, pubTypeId) {
			try {
				return await makeRequest(instanceId, expect(process.env.API_KEY), "POST", "pubs", {
					pubTypeId,
					pubFields: pub,
				});
			} catch (cause) {
				console.error(cause);
				throw new Error("Failed to create pub", { cause });
			}
		},
		async read(instanceId, pubId, ...fields) {
			try {
				return await makeRequest(
					instanceId,
					expect(process.env.API_KEY),
					"GET",
					`pubs${pubId && "/" + pubId}`
				);
			} catch (cause) {
				throw new Error("Failed to get pub", { cause });
			}
		},
		async update(instanceId, pubId, patch) {
			try {
				return await makeRequest(
					instanceId,
					expect(process.env.API_KEY),
					"PATCH",
					`pubs/${pubId}`,
					patch
				);
			} catch (cause) {
				throw new Error("Failed to update pub", { cause });
			}
		},
	};
};
