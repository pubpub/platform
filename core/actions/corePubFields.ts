import { JSONSchemaType } from "ajv";

export type CorePubField = {
	id?: string;
	name: string;
	slug: string;
	schema: {
		name: string;
		namespace: "pubpub";
		schema: JSONSchemaType<any>;
	};
};

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
} satisfies CorePubField;

export const corePubFields = [title];
