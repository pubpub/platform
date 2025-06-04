import { z } from "zod";

import {
	CoreSchemaType,
	FormAccessType,
	formButtonsIdSchema,
	formButtonsInitializerSchema,
	formInputsIdSchema,
	formInputsInitializerSchema,
	formsIdSchema,
	formStructuralElementsIdSchema,
	formStructuralElementsInitializerSchema,
	pubTypesIdSchema,
} from "db/public";

const baseElementSchema = z.object({
	// id: z.string().optional(), // react-hook-form assigned ID, meaningless in our DB
	rank: z.string(),
	deleted: z.boolean().default(false),
	updated: z.boolean().default(false),
	configured: z.boolean().default(true),
});

type baseElement = z.input<typeof baseElementSchema>;

const formBuilderInputElementSchema = formInputsInitializerSchema
	// .omit({ formId: true })
	.extend(baseElementSchema.shape)
	.extend({
		elementId: formInputsIdSchema.optional(),
		schemaName: z.nativeEnum(CoreSchemaType),
		relatedPubTypes: z.array(pubTypesIdSchema).optional(),
		isRelation: z.boolean().default(false),
	})
	.strict();

export type FormBuilderInputElement = z.infer<typeof formBuilderInputElementSchema>;

export const isFormBuilderInputElement = (
	element: FormElementData
): element is FormBuilderInputElement => "component" in element;

const formBuilderStructuralElementSchema = formStructuralElementsInitializerSchema
	// .omit({ formId: true })
	.extend(baseElementSchema.shape)
	.extend({
		elementId: formStructuralElementsIdSchema.optional(),
	})
	.strict();

export type FormBuilderStructuralElement = z.infer<typeof formBuilderStructuralElementSchema>;

export const isFormBuilderStructuralElement = (
	element: FormElementData
): element is FormBuilderStructuralElement => "element" in element;

const formBuilderButtonElementSchema = formButtonsInitializerSchema
	// .omit({ formId: true })
	.extend(baseElementSchema.shape)
	.extend({
		elementId: formButtonsIdSchema.optional(),
	})
	.strict();

export type FormBuilderButtonElement = z.infer<typeof formBuilderButtonElementSchema>;

const formElementSchema = z.union([
	formBuilderInputElementSchema,
	formBuilderStructuralElementSchema,
	formBuilderButtonElementSchema,
]);

export const isFormBuilderButtonElement = (
	element: FormElementData
): element is FormBuilderButtonElement => !("element" in element) && !("component" in element);

export type FormElementData = z.input<typeof formElementSchema>;

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
