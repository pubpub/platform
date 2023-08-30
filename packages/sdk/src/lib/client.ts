import { PubPubError, ResponseError } from "./errors";
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

export type PutResponse<T extends string[]> = {
	[K in T[number]]: unknown;
};

export type Client<T extends Manifest> = {
	get<U extends Get<T>>(instanceId: string, pubId: string, ...fields: U): Promise<GetResponse<U>>;
	put<U extends string[]>(
		instanceId: string,
		pubId: string,
		patch: Put<T>
	): Promise<PutResponse<U>>;
};

export const makeClient = <T extends Manifest>(manifest: T): Client<T> => {
	return {
		async get(instanceId, pubId, ...fields) {
			const signal = AbortSignal.timeout(5000);
			try {
				const response = await fetch(
					`${process.env.PUBPUB_URL}/api/${instanceId}/pubs/${pubId}`,
					{
						method: "GET",
						signal,
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
		async put(instanceId, pubId, patch) {
			try {
				const signal = AbortSignal.timeout(5000);
				const response = await fetch(
					`${process.env.PUBPUB_URL}/api/${instanceId}/pubs/${pubId}`,
					{
						method: "PUT",
						signal,
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
