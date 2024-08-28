import type { FieldValues } from "react-hook-form";

import type { JsonValue } from "contracts";
import type {
	FormElementsId,
	PubFieldSchemaId,
	PubFieldsId,
	PubTypesId,
	StagesId,
	StructuralFormElement,
} from "db/public";
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
	}));
}

export const buildDefaultValues = (
	elements: PubPubForm["elements"],
	pubValues: Record<string, JsonValue>
) => {
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
