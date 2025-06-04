import { type InputComponentConfigSchema, type SchemaTypeByInputComponent } from "schemas";

import type { JsonValue, ProcessedPubWithForm } from "contracts";
import type {
	CoreSchemaType,
	FormButtons,
	FormInputsId,
	FormStructuralElements,
	InputComponent,
	PubFieldsId,
	PubsId,
	PubTypesId,
	PubValuesId,
	StructuralFormElement,
} from "db/public";

import type { Prettify } from "~/lib/types";

// export type InputElementProps<T extends InputComponent> = T extends T
// 	? {
// 			slug: string;
// 			fieldName: string;
// 			config: InputComponentConfigSchema<T>;
// 			schemaName: SchemaTypeByInputComponent[T];
// 		}
// 	: never;

type BaseInputElement = {
	id: FormInputsId;
	fieldId: PubFieldsId;
	fieldName: string;
	required: boolean | null;
	rank: string;
	slug: string;
	isRelation: boolean;
	relatedPubTypes: PubTypesId[];
};

export type BasicInputElement = BaseInputElement & {
	component: InputComponent;
	schemaName: CoreSchemaType;
	config: Record<string, unknown>;
};

export type InputElementForComponent<I extends InputComponent> = BaseInputElement & {
	component: I;
	schemaName: SchemaTypeByInputComponent[I];
	config: InputComponentConfigSchema<I>;
};

export type InputElement = {
	[I in InputComponent]: InputElementForComponent<I>;
}[InputComponent];

export type InputElementProps<T extends InputComponent> = Extract<InputElement, { component: T }>;

export type StructuralElement = Prettify<Omit<FormStructuralElements, "createdAt" | "updatedAt">>;

export type ButtonElement = Prettify<Omit<FormButtons, "createdAt" | "updatedAt">>;

export type FormElements = InputElement | StructuralElement | ButtonElement;

type Filterables =
	| { element: StructuralFormElement }
	| { component: InputComponent }
	| { label: string | null; content: string | null };

export const isInputElement = (element: Filterables): element is InputElement =>
	"fieldId" in element && element.fieldId !== null;

export const isStructuralElement = (element: Filterables): element is StructuralElement =>
	"element" in element && element.element !== null && "content" in element;

export const isButtonElement = (element: Filterables): element is ButtonElement =>
	"label" in element && !("element" in element) && !("component" in element);

export type BasicFormElements = ButtonElement | StructuralElement | BasicInputElement;

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
	value: ProcessedPubWithForm["values"][number]
): value is ProcessedPubWithForm["values"][number] & RelatedFieldValue =>
	Boolean(value.relatedPubId);
