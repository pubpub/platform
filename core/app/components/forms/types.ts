import type { JsonValue, ProcessedPubWithForm } from "contracts"
import type {
	CoreSchemaType,
	FormElementsId,
	InputComponent,
	PubFieldsId,
	PubsId,
	PubTypesId,
	PubValuesId,
	StagesId,
	StructuralFormElement,
} from "db/public"
import type { InputComponentConfigSchema, SchemaTypeByInputComponent } from "schemas"
import type { Prettify } from "utils/types"

import { ElementType } from "db/public"

export type ElementProps<T extends InputComponent> =
	//T extends T
	{
		/**
		 * label ?? slug
		 */
		label: string
		slug: string
		config: InputComponentConfigSchema<T>
		schemaName: SchemaTypeByInputComponent[T]
	}
// : never;

type BasePubFieldElement = {
	id: FormElementsId
	type: ElementType.pubfield
	fieldId: PubFieldsId | null
	fieldName: string
	label: string | null
	content: null
	required: boolean | null
	stageId: null
	element: null
	rank: string
	slug: string
	isRelation: boolean
	relatedPubTypes: PubTypesId[]
}

export type BasicPubFieldElement = BasePubFieldElement & {
	component: InputComponent | null
	schemaName: CoreSchemaType
	config: Record<string, unknown>
	isRelation: boolean
}

export type PubFieldElementComponent = Exclude<InputComponent, InputComponent.relationBlock>

type PubFieldElementMap = {
	[I in PubFieldElementComponent]: BasePubFieldElement & {
		component: I | null
		config: InputComponentConfigSchema<I>
	}
}

export type PubFieldElement<
	I extends PubFieldElementComponent = PubFieldElementComponent,
	IsRelation extends boolean = boolean,
> = I extends I
	? Prettify<
			PubFieldElementMap[I] &
				(IsRelation extends true
					? {
							isRelation: true
							config: InputComponentConfigSchema<InputComponent.relationBlock>
							schemaName: SchemaTypeByInputComponent[I]
						}
					: {
							isRelation: false
							config: Record<string, unknown>
							schemaName: SchemaTypeByInputComponent[I]
						})
		>
	: never

export const isInputElement = <I extends InputComponent>(
	element: BasicPubFieldElement,
	component: I
): element is BasicPubFieldElement & {
	component: I
	schemaName: SchemaTypeByInputComponent[I]
	config: InputComponentConfigSchema<I>
} => {
	return element.type === ElementType.pubfield && element.component === component
}

export const isPubFieldElement = (element: BasicFormElements): element is PubFieldElement => {
	return element.type === ElementType.pubfield
}

export type ButtonElement = {
	id: FormElementsId
	type: ElementType.button
	fieldId: null
	rank: string
	label: string | null
	element: null
	content: null
	required: null
	stageId: StagesId | null
	config: null
	component: null
	schemaName: null
	slug: null
	isRelation: false
	relatedPubTypes: []
}

export type StructuralElement = {
	id: FormElementsId
	type: ElementType.structural
	fieldId: null
	rank: string
	label: string | null
	element: StructuralFormElement | null
	content: string | null
	required: null
	stageId: null
	config: null
	component: null
	schemaName: null
	slug: null
	isRelation: false
	relatedPubTypes: []
}

export type FormElements = PubFieldElement | StructuralElement | ButtonElement

export type BasicFormElements = ButtonElement | StructuralElement | BasicPubFieldElement

export type RelatedFieldValue = {
	value: JsonValue
	relatedPubId: PubsId
	rank: string
	valueId?: PubValuesId
}

export type HydratedRelatedFieldValue = Omit<RelatedFieldValue, "value"> & {
	value: JsonValue | Date
}

export type RelatedFormValues = {
	[slug: string]: RelatedFieldValue[]
}

export type SingleFormValues = {
	[slug: string]: JsonValue
}

export const isRelatedValue = (
	value: ProcessedPubWithForm["values"][number]
): value is ProcessedPubWithForm["values"][number] & RelatedFieldValue =>
	Boolean(value.relatedPubId)
