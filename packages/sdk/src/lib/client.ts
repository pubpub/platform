import { InvalidFieldError, PubPubError, ResponseError } from "./errors";
import { Manifest } from "./types";

export type Get<T extends Manifest> = (
	| Extract<keyof T["register"], string>
	| Extract<keyof T["write"], string>
	| Extract<keyof T["read"], string>
)[];

export type GetResponse<T extends string[]> = {
	// TODO(3mcd): value types should be inferred from manifest
	[K in T[number]]: unknown;
};

export type Put<T extends Manifest> = Record<
	Extract<Extract<keyof T["register"] | keyof T["write"], string>, string>,
	unknown
>;

export type PatchResponse<T extends string[]> = {
	[K in T[number]]: unknown;
};

export type Client<T extends Manifest> = {
	get<U extends Get<T>>(instanceId: string, pubId: string, ...fields: U): Promise<GetResponse<U>>;
	patch<U extends string[]>(
		instanceId: string,
		pubId: string,
		patch: Put<T>
	): Promise<PatchResponse<U>>;
};

export const makeClient = <T extends Manifest>(manifest: T): Client<T> => {
	const write = new Set(manifest.write ? Object.keys(manifest.write) : null);
	const read = new Set(manifest.read ? [write.values(), ...Object.keys(manifest.read)] : write);
	return {
		async get(instanceId, pubId, ...fields) {
			try {
				for (let i = 0; i < fields.length; i++) {
					if (!read.has(fields[i])) {
						throw new InvalidFieldError(`Field ${fields[i]} is not readable`);
					}
				}
				const response = await fetch(
					`${process.env.PUBPUB_URL}/api/v0/integrations/${instanceId}/pubs/${pubId}`,
					{
						method: "GET",
						signal: AbortSignal.timeout(5000),
						headers: { "Content-Type": "application/json" },
					}
				);
				if (response.ok) {
					return response.json();
				}
				switch (response.status) {
					case 404:
						throw new ResponseError(response, "Integration or Pub not found");
					case 403:
						throw new ResponseError(response, "Failed to authorize integration");
				}
				throw new ResponseError(response, "Failed to connect to PubPub");
			} catch (cause) {
				throw new PubPubError("Failed to get Pub", { cause });
			}
		},
		async patch(instanceId, pubId, patch) {
			try {
				for (const key in patch) {
					if (!write.has(key)) {
						throw new InvalidFieldError(`Field ${key} is not writeable`);
					}
				}
				const response = await fetch(
					`${process.env.PUBPUB_URL}/api/v0/instances/${instanceId}/pubs/${pubId}`,
					{
						method: "PUT",
						signal: AbortSignal.timeout(5000),
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ fields: patch }),
					}
				);
				if (response.ok) {
					return response.json();
				}
				switch (response.status) {
					case 404:
						throw new ResponseError(response, "Integration or Pub not found");
					case 403:
						throw new ResponseError(response, "Failed to authorize integration");
				}
				throw new ResponseError(response, "Failed to connect to PubPub");
			} catch (cause) {
				throw new PubPubError("Failed to update Pub", { cause });
			}
		},
	};
};
