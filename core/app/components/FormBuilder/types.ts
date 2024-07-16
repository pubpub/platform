import { z } from "zod";

import { ElementType, FormAccessType, StructuralFormElement } from "db/public";

export const baseElementSchema = z.object({
	elementId: z.string().optional(),
});
export const inputElementSchema = z
	.object({
		type: z.literal(ElementType.pubfield),
		fieldId: z.string(),
		required: z.boolean(),
		label: z.string().nullable().optional().default(null),
		description: z.string().nullable().optional().default(null),
	})
	.merge(baseElementSchema);
export type InputElement = z.infer<typeof inputElementSchema>;

export const structuralElementSchema = z
	.object({
		type: z.literal(ElementType.structural),
		element: z.nativeEnum(StructuralFormElement),
		content: z.string().nullable().optional().default(null),
	})
	.merge(baseElementSchema);

export type StructuralElement = z.infer<typeof structuralElementSchema>;
export const elementSchema = z.discriminatedUnion("type", [
	inputElementSchema,
	structuralElementSchema,
]);

export type FormElementData = z.infer<typeof elementSchema>;
export const isFieldInput = (element: FormElementData) => "fieldId" in element;
export const isStructuralElement = (element: FormElementData) => "element" in element;

export const formBuilderSchema = z.object({
	access: z.nativeEnum(FormAccessType),
	elements: z.array(elementSchema),
	// deletedElementIds: z.array(z.string()),
	formId: z.string(),
});

export type FormBuilderSchema = z.infer<typeof formBuilderSchema>;
export type PanelState = "initial" | "selecting" | "configuring";
export type PanelEvent = "back" | "cancel" | "startAdd" | "select" | "finishAdd";
