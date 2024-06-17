import type { JSONSchemaType } from "ajv";

export type BasePubField<Namespace extends string = string> = {
	id?: string;
	name: string;
	slug: string;
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

export const corePubFields = [title, content, v6PubId] as const;
