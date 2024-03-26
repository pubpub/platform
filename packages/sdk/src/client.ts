import { initClient } from "@ts-rest/core";
import {
	CreatePubRequestBodyWithNulls,
	CreatePubResponseBody,
	GetPubResponseBody,
	GetPubTypeResponseBody,
	JobOptions,
	SafeUser,
	ScheduleEmailResponseBody,
	SendEmailRequestBody,
	SendEmailResponseBody,
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

// TODO: compute this with a generic type alias
export type SuggestedMembersQuery =
	| { email: string }
	| { email: string; firstName: string }
	| { email: string; lastName: string }
	| { email: string; firstName: string; lastName: string }
	| { firstName: string }
	| { lastName: string }
	| { firstName: string; lastName: string };

export type Client<T extends Manifest> = {
	// TODO: Derive these return types from contract
	auth(instanceId: string, token: string): Promise<User>;
	createPub(
		instanceId: string,
		pub: CreatePubRequestBodyWithNulls
	): Promise<CreatePubResponseBody>;
	getPub(instanceId: string, pubId: string): Promise<GetPubResponseBody>;
	updatePub(
		instanceId: string,
		pub: CreatePubRequestBodyWithNulls
	): Promise<UpdatePubResponseBody>;
	deletePub(instanceId: string, pubId: string): Promise<void>;
	sendEmail(instanceId: string, email: SendEmailRequestBody): Promise<SendEmailResponseBody>;
	getSuggestedMembers(instanceId: string, query: SuggestedMembersQuery): Promise<SafeUser[]>;
	getPubType(instanceId: string, pubTypeId: string): Promise<GetPubTypeResponseBody>;
	scheduleEmail(
		instanceId: string,
		email: SendEmailRequestBody,
		jobOptions: JobOptions
	): Promise<ScheduleEmailResponseBody>;
	unscheduleEmail(instanceId: string, key: string): Promise<void>;
	getUsers(instanceId: string, userIds: string[]): Promise<SafeUser[]>;
	getOrCreateUser(
		instanceId: string,
		user: { userId: string } | { email: string; firstName: string; lastName?: string }
	): Promise<User>;
	setInstanceConfig(instanceId: string, instanceConfig: any): Promise<any>;
	getInstanceConfig(instanceId: string): Promise<any>;
	setInstanceState(instanceId: string, pubId: string, state: any): Promise<any>;
	getInstanceState(instanceId: string, pubId: string): Promise<any>;
	generateSignedAssetUploadUrl(
		instanceId: string,
		pubId: string,
		fileName: string
	): Promise<string>;
};

/**
 * Create a client for the PubPub API.
 */
export const makeClient = <T extends Manifest>(manifest: T): Client<T> => {
	const client = initClient(api.integrations, {
		baseUrl: `${process.env.PUBPUB_URL}/api/v0`,
		baseHeaders: {},
		jsonQuery: true,
	});
	return {
		async auth(instanceId, token) {
			try {
				const response = await client.auth({
					headers: {
						authorization: `Bearer ${token}`,
					},
					params: { instanceId },
					cache: "no-cache",
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
					// TODO: investigate @ts-rest/next cache invalidation
					cache: "no-cache",
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to create pub", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async getPub(instanceId, pubId, depth = 1) {
			try {
				const response = await client.getPub({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: { instanceId, pubId },
					cache: "no-cache",
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
					params: { instanceId, pubId: pub.id! },
					body: pub,
					cache: "no-cache",
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to update pub", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async deletePub(instanceId, pubId) {
			try {
				const response = await client.deletePub({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					body: {},
					params: { instanceId, pubId },
					cache: "no-cache",
				});
				if (response.status === 200) {
					return;
				}
				throw new Error("Failed to delete pub", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async sendEmail(instanceId, email) {
			try {
				const response = await client.sendEmail({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: { instanceId },
					body: email,
					cache: "no-cache",
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to send email", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async getSuggestedMembers(instanceId, query) {
			try {
				const response = await client.getSuggestedMembers({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: { instanceId },
					query,
					cache: "no-cache",
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to get suggested members", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async getPubType(instanceId, pubTypeId) {
			try {
				const response = await client.getPubType({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: { instanceId, pubTypeId },
					cache: "no-cache",
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to get pub type", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async scheduleEmail(instanceId, email, jobOptions) {
			try {
				const response = await client.scheduleEmail({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: { instanceId },
					body: email,
					query: jobOptions,
					cache: "no-cache",
				});
				if (response.status === 202) {
					return response.body;
				}
				throw new Error("Failed to schedule email", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async unscheduleEmail(instanceId, key) {
			try {
				const response = await client.unscheduleEmail({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					body: {},
					params: { instanceId, key },
					cache: "no-cache",
				});
				if (response.status === 200) {
					return;
				}
				throw new Error("Failed to unschedule email", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async getUsers(instanceId, userIds) {
			try {
				const response = await client.getUsers({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: { instanceId },
					query: { userIds },
					cache: "no-cache",
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to get users", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async getOrCreateUser(instanceId, user) {
			try {
				const response = await client.getOrCreateUser({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: { instanceId },
					body: user,
					cache: "no-cache",
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to get or create user", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async generateSignedAssetUploadUrl(instanceId, pubId, fileName) {
			try {
				const response = await client.generateSignedAssetUploadUrl({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: {
						instanceId: instanceId,
					},
					body: {
						pubId: pubId,
						fileName: fileName,
					},
					cache: "no-cache",
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to create signed URL", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async setInstanceConfig(instanceId, instance) {
			try {
				const response = await client.setInstanceConfig({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: { instanceId },
					body: instance,
					cache: "no-cache",
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to create instance config", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async getInstanceConfig(instanceId) {
			try {
				const response = await client.getInstanceConfig({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: { instanceId },
					cache: "no-cache",
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to get instance config", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async setInstanceState(instanceId, pubId, state) {
			try {
				const response = await client.setInstanceState({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: { instanceId, pubId },
					body: state,
					cache: "no-cache",
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to set instance state", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
		async getInstanceState(instanceId, pubId) {
			try {
				const response = await client.getInstanceState({
					headers: {
						authorization: `Bearer ${process.env.API_KEY}`,
					},
					params: { instanceId, pubId },
					cache: "no-cache",
				});
				if (response.status === 200) {
					return response.body;
				}
				throw new Error("Failed to get instance state", { cause: response });
			} catch (cause) {
				throw new Error("Request failed", { cause });
			}
		},
	};
};
