"use client"

import type { ProcessedPubWithForm } from "contracts"
import type { PubFieldElement } from "~/app/components/forms/types"

import { defaultComponent } from "schemas"

import { ElementType, type FormElementsId, type PubsId, type PubTypesId } from "db/public"
import { FormSubmitButton } from "ui/submit-button"

import { FormElement } from "~/app/components/forms/FormElement"
import { PubEditorClient } from "~/app/components/pubs/PubEditor/PubEditorClient"

type PubValue = ProcessedPubWithForm<{
	withRelatedPubs: true
	withStage: true
	withPubType: true
	withMembers: true
}>["values"][number]

type InlineEditFormProps = {
	values: PubValue[]
	formSlug: string
	pubId: PubsId
	onClose: () => void
}

const valueToFormElement = (value: PubValue): PubFieldElement => {
	const base = {
		type: ElementType.pubfield as const,
		fieldId: value.fieldId,
		fieldName: value.fieldName,
		content: null,
		stageId: null,
		element: null,
		rank: value.rank ?? "",
		slug: value.fieldSlug,
		isRelation: Boolean(value.relatedPubId),
		required: true,
	}

	if ("formElementComponent" in value) {
		return {
			...base,
			id: value.formElementId,
			component: value.formElementComponent,
			label: value.formElementLabel,
			config: value.formElementConfig ?? {},
			schemaName: value.schemaName,
			relatedPubTypes: value.formElementRelatedPubTypes,
		} as PubFieldElement
	}

	return {
		...base,
		id: value.fieldId as unknown as FormElementsId,
		component: defaultComponent(value.schemaName),
		label: value.fieldName,
		config: {},
		schemaName: value.schemaName,
		relatedPubTypes: [],
	} as PubFieldElement
}

export const InlineEditForm = ({ values, formSlug, pubId, onClose }: InlineEditFormProps) => {
	const firstValue = values[0]
	if (!firstValue) {
		return null
	}

	const element = valueToFormElement(firstValue)
	const actualValues = values.filter((v) => v.id !== null)

	return (
		<PubEditorClient
			withAutoSave={false}
			withButtonElements={false}
			className="w-full items-start gap-2 p-0 [&_label]:sr-only"
			mode="edit"
			pub={{
				id: pubId,
				values: actualValues,
				pubTypeId: "xxx" as PubTypesId,
			}}
			onSuccess={onClose}
			formSlug={formSlug}
			elements={[element]}
		>
			{(formInstance) => (
				<>
					<FormElement element={element} values={actualValues} pubId={pubId} />
					<FormSubmitButton
						size="sm"
						formState={formInstance.formState}
						idleText="Save"
						pendingText="Saving..."
						successText="Saved"
						errorText="Error saving"
						className="ml-auto w-30"
					/>
				</>
			)}
		</PubEditorClient>
	)
}
