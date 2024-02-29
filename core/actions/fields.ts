import { type Prisma } from "@prisma/client";
import { JSONSchemaType } from "ajv";

export type CoreField = Prisma.PubFieldSchemaCreateInput;

export const title = {
	name: "title",
	namespace: "pubpub",
	schema: {
		$id: "pubpub:title",
		title: "Title",
		type: "string",
	} satisfies JSONSchemaType<string>,
} satisfies CoreField;
