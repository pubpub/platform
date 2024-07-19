import { z } from "zod";

import type { ElementType, PubFieldsId, StructuralFormElement } from "db/public";
import {
	FormAccessType,
	formElementsIdSchema,
	formElementsInitializerSchema,
	formsIdSchema,
} from "db/public";

const baseElementSchema = z.object({
	elementId: formElementsIdSchema.optional(),
	deleted: z.boolean().optional().default(false),
	updated: z.boolean().optional().default(false),
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
	.merge(baseElementSchema)
	.omit({ formId: true, id: true });
export type FormElementData = z.input<typeof formElementSchema>;
export const isFieldInput = (element: FormElementData): element is InputElement =>
	"fieldId" in element;
export const isStructuralElement = (element: FormElementData): element is StructuralElement =>
	"element" in element;

export const formBuilderSchema = z.object({
	access: z.nativeEnum(FormAccessType),
	elements: z.array(formElementSchema),
	formId: formsIdSchema,
});

export type FormBuilderSchema = z.input<typeof formBuilderSchema>;
export type PanelState = "initial" | "selecting" | "configuring";
export type PanelEvent = "back" | "cancel" | "add" | "configure" | "save";
