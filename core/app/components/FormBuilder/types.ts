import { z } from "zod";

import type { InputComponent, PubFieldsId, StagesId, StructuralFormElement } from "db/public";
import {
	CoreSchemaType,
	ElementType,
	FormAccessType,
	formElementsIdSchema,
	formElementsInitializerSchema,
	formsIdSchema,
} from "db/public";

const baseElementSchema = z.object({
	id: z.string().optional(), // react-hook-form assigned ID, meaningless in our DB
	elementId: formElementsIdSchema.optional(),
	order: z.number().int().nullable(),
	deleted: z.boolean().default(false),
	updated: z.boolean().default(false),
	configured: z.boolean().default(true),
	stageId: z.string().nullable().optional(),
	schemaName: z.nativeEnum(CoreSchemaType).nullable().optional(),
	isRelation: z.boolean().nullable().default(false),
});

type baseElement = z.input<typeof baseElementSchema>;

export type InputElement = baseElement & {
	type: ElementType.pubfield;
	fieldId: PubFieldsId;
	required: boolean | null;
	// label is only used by elements with type: ElementType.button. Pubfield inputs put everything in config
	label: never;
	placeholder?: string | null;
	help?: string | null;
	element: never;
	content: never;
	schemaName: CoreSchemaType;
	component: InputComponent;
	config?: unknown;
};

export type StructuralElement = baseElement & {
	type: ElementType.structural;
	element: StructuralFormElement;
	content: string;
	fieldId: never;
	required: never;
	label: never;
	placeholder: never;
};

export type ButtonElement = baseElement & {
	type: ElementType.button;
	label: string;
	content: string;
	stageId?: StagesId;
	fieldId: never;
	required: never;
	placeholder: never;
};

const formElementSchema = formElementsInitializerSchema
	.omit({ formId: true })
	.extend(baseElementSchema.shape)
	.strict();

export type FormElementData = z.input<typeof formElementSchema>;

export const isFieldInput = (element: FormElementData): element is InputElement =>
	element.type === ElementType.pubfield;
export const isStructuralElement = (element: FormElementData): element is StructuralElement =>
	element.type === ElementType.structural;
export const isButtonElement = (element: FormElementData): element is ButtonElement =>
	element.type === ElementType.button;

export const formBuilderSchema = z.object({
	access: z.nativeEnum(FormAccessType),
	elements: z.array(formElementSchema),
	formId: formsIdSchema,
});

export type FormBuilderSchema = z.input<typeof formBuilderSchema>;
export type PanelState = {
	state: "initial" | "selecting" | "editing" | "editingButton";
	backButton: PanelState["state"] | null;
	selectedElementIndex: number | null;
	fieldsFilter: string | null;
	buttonId: string | null;
};
export type PanelEvent =
	| { eventName: "filterFields"; fieldsFilter: PanelState["fieldsFilter"] }
	| { eventName: "back"; selectedElementIndex?: PanelState["selectedElementIndex"] }
	| { eventName: "cancel"; selectedElementIndex?: PanelState["selectedElementIndex"] }
	| { eventName: "add" }
	| { eventName: "edit"; selectedElementIndex: PanelState["selectedElementIndex"] }
	| { eventName: "save" }
	| { eventName: "editButton"; buttonId?: PanelState["buttonId"] };
