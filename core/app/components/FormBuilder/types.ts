import { z } from "zod";

import type { PubFieldsId, StructuralFormElement } from "db/public";
import {
	ElementType,
	FormAccessType,
	formElementsIdSchema,
	formElementsInitializerSchema,
	formsIdSchema,
} from "db/public";

const baseElementSchema = z.object({
	id: z.string().optional(), // react-hook-form assigned ID, meaningless in our DB
	elementId: formElementsIdSchema.optional(),
	order: z.number().int(),
	deleted: z.boolean().default(false),
	updated: z.boolean().default(false),
});

type baseElement = z.input<typeof baseElementSchema>;

export type InputElement = baseElement & {
	type: ElementType.pubfield;
	fieldId: PubFieldsId;
	required: boolean;
	label?: string | null;
	description?: string | null;
	element: never;
	content: never;
};

export type StructuralElement = baseElement & {
	type: ElementType.structural;
	element: StructuralFormElement;
	content: string;
	fieldId: never;
	required: never;
	label?: never;
	description?: never;
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

export const formBuilderSchema = z.object({
	access: z.nativeEnum(FormAccessType),
	elements: z.array(formElementSchema),
	formId: formsIdSchema,
});

export type FormBuilderSchema = z.input<typeof formBuilderSchema>;
export type PanelState = "initial" | "selecting" | "configuring";
export type PanelEvent = "back" | "cancel" | "add" | "configure" | "save";
