import { type InputComponentConfigSchema, type SchemaTypeByInputComponent } from "schemas";

import type { JsonValue, ProcessedPub } from "contracts";
import type {
	CoreSchemaType,
	ElementType,
	FormElementsId,
	InputComponent,
	PubFieldsId,
	PubsId,
	PubTypesId,
	PubValuesId,
	StagesId,
	StructuralFormElement,
} from "db/public";

export type ElementProps<T extends InputComponent> = T extends T
	? {
			/**
			 * label ?? slug
			 */
			label: string;
			slug: string;
			config: InputComponentConfigSchema<T>;
			schemaName: SchemaTypeByInputComponent[T];
		}
	: never;

type BasePubFieldElement = {
	id: FormElementsId;
	type: ElementType.pubfield;
	fieldId: PubFieldsId | null;
	fieldName: string;
	label: string | null;
	content: null;
	required: boolean | null;
	stageId: null;
	element: null;
	rank: string;
	slug: string;
	isRelation: boolean;
	relatedPubTypes: PubTypesId[];
};

export type BasicPubFieldElement = BasePubFieldElement & {
	component: InputComponent | null;
	schemaName: CoreSchemaType;
	config: Record<string, unknown>;
};

export type PubFieldElement = {
	[I in InputComponent]: BasePubFieldElement & {
		component: I | null;
		schemaName: SchemaTypeByInputComponent[I];
		config: InputComponentConfigSchema<I>;
	};
}[InputComponent];

export type ButtonElement = {
	id: FormElementsId;
	type: ElementType.button;
	fieldId: null;
	rank: string;
	label: string | null;
	element: null;
	content: null;
	required: null;
	stageId: StagesId | null;
	config: null;
	component: null;
	schemaName: null;
	slug: null;
	isRelation: false;
	relatedPubTypes: [];
};

export type StructuralElement = {
	id: FormElementsId;
	type: ElementType.structural;
	fieldId: null;
	rank: string;
	label: string | null;
	element: StructuralFormElement | null;
	content: string | null;
	required: null;
	stageId: null;
	config: null;
	component: null;
	schemaName: null;
	slug: null;
	isRelation: false;
	relatedPubTypes: [];
};

export type FormElements = PubFieldElement | StructuralElement | ButtonElement;

export type BasicFormElements = ButtonElement | StructuralElement | BasicPubFieldElement;

export type RelatedFieldValue = {
	value: JsonValue;
	relatedPubId: PubsId;
	rank: string;
	valueId?: PubValuesId;
};

export type HydratedRelatedFieldValue = Omit<RelatedFieldValue, "value"> & {
	value: JsonValue | Date;
};

export type RelatedFormValues = {
	[slug: string]: RelatedFieldValue[];
};

export type SingleFormValues = {
	[slug: string]: JsonValue;
};

export const isRelatedValue = (
	value: ProcessedPub["values"][number]
): value is ProcessedPub["values"][number] & RelatedFieldValue => Boolean(value.relatedPubId);
