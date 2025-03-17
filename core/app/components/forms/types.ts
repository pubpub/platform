import { type InputComponentConfigSchema, type SchemaTypeByInputComponent } from "schemas";

import type {
	CoreSchemaType,
	ElementType,
	FormElementsId,
	InputComponent,
	PubFieldsId,
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
	stageId: null;
	config: null;
	component: null;
	schemaName: null;
	slug: null;
	isRelation: false;
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
};

export type FormElements = PubFieldElement | StructuralElement | ButtonElement;

export type BasicFormElements = ButtonElement | StructuralElement | BasicPubFieldElement;
