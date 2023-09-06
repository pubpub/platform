import { InvalidFieldError, PubPubError, ResponseError, ZodError } from "./errors";
import { Manifest } from "./types";

export type Get<T extends Manifest> = (
	| Extract<keyof T["register"], string>
	| Extract<keyof T["write"], string>
	| Extract<keyof T["read"], string>
)[];

export type Patch<T extends Manifest> = Record<
	Extract<Extract<keyof T["register"] | keyof T["write"], string>, string>,
	unknown
>;

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
	create<U extends string[]>(
		instanceId: string,
		pub: Patch<T>,
		pubTypeId: string
	): Promise<UpdateResponse<U>>;
	read<U extends Get<T>>(
		instanceId: string,
		pubId: string,
		...fields: U
	): Promise<ReadResponse<U>>;
	update<U extends string[]>(
		instanceId: string,
		pubId: string,
		patch: Patch<T>
	): Promise<UpdateResponse<U>>;
};

const makeRequest = async (
	instanceId: string,
	method: string,
	path?: string | null | undefined,
	body?: unknown
) => {
	const url = `${process.env.PUBPUB_URL}/api/v0/integrations/${instanceId}${
		path ? `/${path}` : ""
	}`;
	const signal = AbortSignal.timeout(5000);
	const headers = { "Content-Type": "application/json" };
	const response = await fetch(url, {
		method,
		headers,
		signal,
		body: body ? JSON.stringify(body) : undefined,
	});
	if (response.ok) {
		return response.json();
	}
	switch (response.status) {
		// 400 errors are expected to be JSON.
		case 400:
			let json: object;
			try {
				json = await response.json();
			} catch (error) {
				// Did not get a JSON response.
				break;
			}
			if ("name" in json && "issues" in json) {
				switch (json.name) {
					case "ZodError":
						throw new ZodError(json as any);
					default:
						throw new ResponseError(response, "Invalid request");
				}
			}
			break;
		case 403:
			throw new ResponseError(response, "Failed to authorize integration");
		case 404:
			throw new ResponseError(response, "Integration not found");
	}
	throw new ResponseError(response, "Failed to connect to PubPub");
};

export const makeClient = <T extends Manifest>(manifest: T): Client<T> => {
	const write = new Set(manifest.write ? Object.keys(manifest.write) : null);
	const read = new Set(manifest.read ? [write.values(), ...Object.keys(manifest.read)] : write);
	return {
		async create(instanceId, pubFields, pubTypeId) {
			for (let pubField in pubFields) {
				if (!write.has(pubField)) {
					throw new InvalidFieldError(`Field ${pubField} is not writeable`);
				}
			}
			try {
				return makeRequest(instanceId, "POST", "pubs", {
					pubTypeId,
					pubFields: pubFields,
				});
			} catch (cause) {
				throw new PubPubError("Failed to create Pub", { cause });
			}
		},
		async read(instanceId, pubId, ...pubFields) {
			try {
				for (let i = 0; i < pubFields.length; i++) {
					if (!read.has(pubFields[i])) {
						throw new InvalidFieldError(`Field ${pubFields[i]} is not readable`);
					}
				}
				return makeRequest(instanceId, "GET", "pubs", pubId);
			} catch (cause) {
				throw new PubPubError("Failed to get Pub", { cause });
			}
		},
		async update(instanceId, pubId, pubPatch) {
			try {
				for (const pubField in pubPatch) {
					if (!write.has(pubField)) {
						throw new InvalidFieldError(`Field ${pubField} is not writeable`);
					}
				}
				return makeRequest(instanceId, "PATCH", `pubs/${pubId}`, pubPatch);
			} catch (cause) {
				throw new PubPubError("Failed to update Pub", { cause });
			}
		},
	};
};
