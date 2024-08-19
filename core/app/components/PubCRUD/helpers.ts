import { v4 as uuidv4 } from "uuid";

import type {
	CoreSchemaType,
	FormElementsId,
	PubFieldSchemaId,
	PubFieldsId,
	PubTypesId,
	StagesId,
	StructuralFormElement,
} from "db/public";
import { ElementType } from "db/public";

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
	const randomUUID = uuidv4();
	return pubType.fields.map((field, index) => ({
		slug: field.slug || null,
		schemaName: field.schemaName || null,
		type: ElementType.pubfield, // Replace with actual ElementType based on your logic
		order: index + 1,
		description: field.name || null, // or any other logic to set description
		stageId: null, // Replace with actual StagesId if needed
		fieldId: field.id || null,
		label: field.name || null,
		element: null, // Replace with actual StructuralFormElement if needed
		content: null,
		required: false, // or any other logic to set required
		elementId: randomUUID as FormElementsId, // Replace with logic to generate or assign elementId
	}));
}
