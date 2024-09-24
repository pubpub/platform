import { TObject, TString, Type } from "@sinclair/typebox";
import { getJsonSchemaByCoreSchemaType } from "schemas";

import type { FormElementsId } from "db/public";
import { CoreSchemaType, ElementType } from "db/public";

import type { Form } from "~/lib/server/form";
import { PubValues } from "~/lib/server";
import { PubField } from "~/lib/types";

// Function to create an element object based on pubType parameter
export function makeFormElementDefFromPubFields(
	pubFields: Pick<PubField, "id" | "name" | "slug" | "schemaName">[]
): Form["elements"][number][] {
	return pubFields.map((field, index) => ({
		slug: field.slug || null,
		schemaName: field.schemaName || null,
		type: ElementType.pubfield,
		order: index + 1,
		description: field.name || null,
		stageId: null,
		fieldId: field.id || null,
		label: field.name || null,
		element: null,
		content: null,
		required: false,
		elementId: field.id as unknown as FormElementsId, // use field.id?
		component: null,
		config: {},
	}));
}

export const createPubEditorDefaultValuesFromPubFields = (
	pubFields: Pick<PubField, "slug" | "schemaName">[],
	pubValues: PubValues,
	pubTypeId?: string,
	stageId?: string
) => {
	return {
		pubTypeId,
		stageId,
		...pubFields.reduce(
			(acc, { slug }) => {
				acc[slug] =
					pubFields.find((e) => e.slug === slug)?.schemaName === CoreSchemaType.DateTime
						? new Date(pubValues[slug] as string)
						: pubValues[slug];
				return acc;
			},
			{} as Record<string, unknown>
		),
	};
};

export const createPubEditorSchemaFromPubFields = (
	pubFields: Pick<PubField, "slug" | "schemaName">[]
): TObject<{ pubTypeId: TString; stageId: TString }> => {
	const pubFieldSchemasBySlug = Object.fromEntries(
		pubFields.map(({ slug, schemaName }) => {
			if (!schemaName) {
				return [slug, undefined];
			}

			const schema = getJsonSchemaByCoreSchemaType(schemaName);
			if (!schema) {
				return [slug, undefined];
			}

			if (schema.type !== "string") {
				return [slug, Type.Optional(schema)];
			}

			// this allows for empty strings, which happens when you enter something
			// in an input field and then delete it
			// TODO: reevaluate whether this should be "" or undefined
			const schemaWithAllowedEmpty = Type.Union([schema, Type.Literal("")], {
				error: schema.error ?? "Invalid value",
			});
			return [slug, schemaWithAllowedEmpty];
		})
	);

	return Type.Object<{ pubTypeId: TString; stageId: TString }>({
		pubTypeId: Type.String({ format: "uuid" }),
		stageId: Type.String({ format: "uuid" }),
		...pubFieldSchemasBySlug,
	});
};
