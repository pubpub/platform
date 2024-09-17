import type { FieldValues } from "react-hook-form";

import { Type } from "@sinclair/typebox";
import { getJsonSchemaByCoreSchemaType } from "schemas";

import type {
	FormElementsId,
	PubFields,
	PubFieldSchema,
	PubFieldSchemaId,
	PubFieldsId,
	PubTypes,
	PubTypesId,
	PubValues,
	StagesId,
	StructuralFormElement,
} from "db/public";
import type { InputComponent } from "db/src/public/InputComponent";
import { CoreSchemaType, ElementType } from "db/public";

import type { Form as PubPubForm } from "~/lib/server/form";

// Function to create an element object based on pubType parameter
export function createElementFromPubType(pubType: {
	id: PubTypesId;
	name: string;
	description: string | null;
	fields: {
		id: PubFieldsId;
		name: string;
		slug: string;
		pubFieldSchemaId: PubFieldSchemaId | null;
		schemaName: CoreSchemaType | null;
		schema: {
			id: PubFieldSchemaId;
			name: string;
			namespace: string;
			schema: unknown;
		} | null;
	}[];
}): {
	slug: string | null;
	schemaName: CoreSchemaType | null;
	type: ElementType;
	order: number | null;
	description: string | null;
	stageId: StagesId | null;
	fieldId: PubFieldsId | null;
	label: string | null;
	element: StructuralFormElement | null;
	content: string | null;
	required: boolean | null;
	elementId: FormElementsId;
	component: InputComponent | null;
	config: {} | undefined;
}[] {
	return pubType.fields.map((field, index) => ({
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

export const buildDefaultValues = (elements: PubPubForm["elements"], pubValues: PubValues) => {
	const defaultValues: FieldValues = { ...pubValues };
	const dateElements = elements.filter((e) => e.schemaName === CoreSchemaType.DateTime);
	for (const de of dateElements) {
		if (de.slug) {
			const pubValue = pubValues[de.slug];
			if (pubValue) {
				defaultValues[de.slug] = new Date(pubValue as string);
			}
		}
	}
	return defaultValues;
};

export const createSchemaFromElements = (elements: PubPubForm["elements"]) => {
	return Type.Object(
		Object.fromEntries(
			elements
				// only add pubfields to the schema
				.filter((e) => e.type === ElementType.pubfield)
				.map(({ slug, schemaName }) => {
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
		)
	);
};

type PubType = {
	pubType: Pick<PubTypes, "id" | "name" | "description" | "communityId"> & {
		fields: Array<
			Pick<PubFields, "id" | "name" | "pubFieldSchemaId" | "slug" | "schemaName"> & {
				schema: Pick<PubFieldSchema, "id" | "namespace" | "name" | "schema"> | null;
			}
		>;
	};
};

export const createFieldsForSever = (
	values: { [s: string]: string },
	pubType: PubType["pubType"]
) =>
	Object.entries(values).reduce((acc, [key, value]) => {
		const id = pubType?.fields.find((f) => f.slug === key)?.id;
		if (id) {
			acc[id] = { slug: key, value };
		}
		return acc;
	}, {});
