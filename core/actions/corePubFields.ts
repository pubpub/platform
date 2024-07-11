import type { JSONSchemaType } from "ajv";

import CoreSchemaType from "db/public/CoreSchemaType";

export type BasePubField<Namespace extends string = string> = {
	id?: string;
	name: string;
	slug: string;
	schemaName?: CoreSchemaType;
	schema: {
		name: string;
		namespace: Namespace;
		schema: JSONSchemaType<any>;
	};
};

export type CorePubField = BasePubField<"pubpub">;

export const title = {
	name: "Title",
	slug: "pubpub:title",
	schemaName: CoreSchemaType.String,
	schema: {
		name: "title",
		namespace: "pubpub",
		schema: {
			$id: "pubpub:title",
			title: "Title",
			type: "string",
		} satisfies JSONSchemaType<string>,
	},
} as const satisfies CorePubField;

export const content = {
	name: "Content",
	slug: "pubpub:content",
	schemaName: CoreSchemaType.String,
	schema: {
		name: "content",
		namespace: "pubpub",
		schema: {
			$id: "pubpub:content",
			title: "Content",
			type: "string",
		} satisfies JSONSchemaType<string>,
	},
} as const satisfies CorePubField;

export const v6PubId = {
	name: "V6 Pub ID",
	slug: "pubpub:v6-pub-id",
	schemaName: CoreSchemaType.String,
	schema: {
		name: "v6-pub-id",
		namespace: "pubpub",
		schema: {
			$id: "pubpub:v6-pub-id",
			title: "V6 Pub ID",
			type: "string",
		} satisfies JSONSchemaType<string>,
	},
} as const satisfies CorePubField;

// these are just to play around with the pubfields in actions for now
export const email = {
	name: "Email",
	slug: "pubpub:email",
	schemaName: CoreSchemaType.Email,
	schema: {
		name: "email",
		namespace: "pubpub",
		schema: {
			$id: "pubpub:email",
			title: "Email",
			format: "email",
			type: "string",
		} satisfies JSONSchemaType<string>,
	},
} as const satisfies CorePubField;

export const url = {
	name: "URL",
	slug: "pubpub:url",
	schemaName: CoreSchemaType.URL,
	schema: {
		name: "url",
		namespace: "pubpub",
		schema: {
			$id: "pubpub:url",
			title: "URL",
			format: "url",
			type: "string",
		} satisfies JSONSchemaType<string>,
	},
} as const satisfies CorePubField;

export const userId = {
	name: "User ID",
	slug: "pubpub:user-id",
	schemaName: CoreSchemaType.UserId,
	schema: {
		name: "userId",
		namespace: "pubpub",
		schema: {
			$id: "pubpub:user-id",
			title: "User ID",
			type: "string",
		} satisfies JSONSchemaType<string>,
	},
} as const satisfies CorePubField;

export const corePubFields = [title, content, v6PubId, email, url, userId] as const;
