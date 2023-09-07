import { ValidationError, PubPubError, ResponseError, ZodError } from "./errors";
import { Manifest } from "./types";

// TODO: derive this type from core API contract
export type User = {
	id: string;
	slug: string;
	email: string;
	name: string;
	avatar?: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type Get<T extends Manifest> = (
	| Extract<keyof T["register"], string>
	| Extract<keyof T["write"], string>
	| Extract<keyof T["read"], string>
)[];

export type Pub<T extends Manifest> = Record<
	Extract<Extract<keyof T["register"] | keyof T["write"], string>, string>,
	unknown
>;

export type Patch<T extends Manifest> = {
	[K in keyof Pub<T>]?: unknown;
};

export type CreateResponse<T extends string[]> = {
	[K in T[number]]: unknown;
};

export type ReadResponse<T extends string[]> = {
	// TODO(3mcd): value types should be inferred from manifest
	[K in T[number]]: unknown;
};

export type UpdateResponse<T extends string[]> = {
	[K in T[number]]: unknown;
};

export type Client<T extends Manifest> = {
	auth(instanceId: string, token: string): Promise<User>;
	create<U extends string[]>(
		instanceId: string,
		token: string,
		pub: Pub<T>,
		pubTypeId: string
	): Promise<UpdateResponse<U>>;
	read<U extends Get<T>>(
		instanceId: string,
		token: string,
		pubId: string,
		...fields: U
	): Promise<ReadResponse<U>>;
	update<U extends string[]>(
		instanceId: string,
		token: string,
		pubId: string,
		patch: Patch<T>
	): Promise<UpdateResponse<U>>;
};

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
	const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
	const response = await fetch(url, {
		method,
		headers,
		signal,
		body: body ? JSON.stringify(body) : undefined,
		cache: "no-store",
	});
	if (response.ok) {
		return response.json();
	}
	switch (response.status) {
		// 400 errors are expected to be JSON.
		case 400:
			let json: unknown;
			try {
				json = await response.json();
			} catch (error) {
				// Did not get a JSON response.
				break;
			}
			if (typeof json === "object" && json !== null && "name" in json && "issues" in json) {
				switch (json.name) {
					case "ZodError":
						throw new ZodError(json as { issues: object[] });
					default:
						throw new ResponseError(response, "Invalid request");
				}
			}
			break;
		case 401:
			throw new ResponseError(response, "Failed to authenticate user or integration");
		case 403:
			throw new ResponseError(response, "Failed to authorize user or integration");
		case 404:
			throw new ResponseError(response, "Integration not found");
	}
	throw new ResponseError(response, "Failed to connect to PubPub");
};

export const makeClient = <T extends Manifest>(manifest: T): Client<T> => {
	const write = new Set(manifest.write ? Object.keys(manifest.write) : null);
	const read = new Set(manifest.read ? [write.values(), ...Object.keys(manifest.read)] : write);
	return {
		async auth(instanceId, token) {
			try {
				const userRaw = await makeRequest(instanceId, token, "POST", "auth", null);
				const user = {
					...userRaw,
					createdAt: new Date(userRaw.createdAt),
					updatedAt: new Date(userRaw.updatedAt),
				};
				return user;
			} catch (cause) {
				throw new PubPubError("Failed to authenticate user or integration", { cause });
			}
		},
		async create(instanceId, token, pub, pubTypeId) {
			for (let field in pub) {
				if (!write.has(field)) {
					throw new ValidationError(`Field ${field} is not writeable`);
				}
			}
			try {
				return makeRequest(instanceId, token, "POST", "pubs", {
					pubTypeId,
					pubFields: pub,
				});
			} catch (cause) {
				throw new PubPubError("Failed to create Pub", { cause });
			}
		},
		async read(instanceId, token, pubId, ...fields) {
			try {
				for (let i = 0; i < fields.length; i++) {
					if (!read.has(fields[i])) {
						throw new ValidationError(`Field ${fields[i]} is not readable`);
					}
				}
				return makeRequest(instanceId, token, "GET", "pubs", pubId);
			} catch (cause) {
				throw new PubPubError("Failed to get Pub", { cause });
			}
		},
		async update(instanceId, token, pubId, patch) {
			try {
				for (const field in patch) {
					if (!write.has(field)) {
						throw new ValidationError(`Field ${field} is not writeable`);
					}
				}
				return makeRequest(instanceId, token, "PATCH", `pubs/${pubId}`, patch);
			} catch (cause) {
				throw new PubPubError("Failed to update Pub", { cause });
			}
		},
	};
};
