"use client"

import type { PubFieldElement } from "~/app/components/forms/types"
import type { FullProcessedPubWithForm } from "~/lib/server"

import { useState } from "react"
import { typeboxResolver } from "@hookform/resolvers/typebox"
import { Type } from "@sinclair/typebox"
import { Pencil } from "lucide-react"
import { useForm } from "react-hook-form"
import { getJsonSchemaByCoreSchemaType, SCHEMA_TYPES_WITH_ICONS } from "schemas"

/**
 * Get the label a form/pub value combo might have. In preference order:
 * 1. "label" on a FormElement
 * 2. "config.label" on a FormElement
 * 3. the name of the PubField
 **/
const _getLabel = (value: FullProcessedPubWithForm["values"][number]) => {
	// Default to the field name
	const defaultLabel = value.fieldName
	let configLabel: string | null = null
	let formElementLabel: string | null = null
	if ("formElementId" in value) {
		const config = value.formElementConfig
		if (config) {
			configLabel = "label" in config ? (config.label ?? null) : null
		}
		formElementLabel = value.formElementLabel
	}
	return formElementLabel || configLabel || defaultLabel
}

import type { JsonValue } from "contracts"

import {
	type CoreSchemaType,
	ElementType,
	type FormElementsId,
	type PubsId,
	type PubValuesId,
} from "db/public"
import { Button } from "ui/button"
import { Form } from "ui/form"
import { FormSubmitButton } from "ui/submit-button"
import { cn } from "utils"

import { FormElement } from "~/app/components/forms/FormElement"
import { updatePub } from "~/app/components/pubs/PubEditor/actions"
import { didSucceed, useServerAction } from "~/lib/serverActions"
import { PubValue } from "./PubValue"

export const PubValueHeading = ({
	depth,
	children,
	...props
}: React.HTMLAttributes<HTMLHeadingElement> & { depth: number }) => {
	// For "Other Fields" section header which might be one lower than any pub depth
	if (depth < 1) {
		return <h2 {...props}>{children}</h2>
	}
	// Pub depth starts at 1
	switch (depth - 1) {
		case 0:
			return <h2 {...props}>{children}</h2>
		case 1:
			return <h3 {...props}>{children}</h3>
		case 2:
			return <h4 {...props}>{children}</h4>
		default:
			return <h5 {...props}>{children}</h5>
	}
}

export const FieldBlock = ({
	pubId,
	name,
	slug,
	values,
	depth,
	schemaType,
	formSlug,
}: {
	pubId: PubsId
	name: string
	slug: string
	schemaType: CoreSchemaType
	values: FullProcessedPubWithForm["values"]
	depth: number
	formSlug: string
}) => {
	const _slugWithoutCommunity = slug.split(":").pop()
	const SchemaTypeIcon = SCHEMA_TYPES_WITH_ICONS[schemaType]?.icon

	const [_isEditing, setIsEditing] = useState(false)
	const _firstValue = values[0]

	const toggleEditing = () => {
		setIsEditing((prev) => !prev)
	}
	const label = _getLabel(_firstValue)

	return (
		<>
			<Button
				variant="ghost"
				className="group relative col-span-2 col-start-2 flex flex-col items-start gap-0"
				onClick={toggleEditing}
			>
				<PubValueHeading depth={depth} className="font-medium">
					{label}
				</PubValueHeading>
				<div className="flex items-center gap-1">
					{SchemaTypeIcon && <SchemaTypeIcon className="w-3 text-muted-foreground" />}
					<code className="text-muted-foreground text-xs">{_slugWithoutCommunity}</code>
				</div>
				<Pencil
					size={14}
					className={cn(
						"absolute top-1 right-1 text-muted-foreground/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100",
						_isEditing && "opacity-100"
					)}
				/>
			</Button>
			<div data-testid={`${name}-value`} className="col-span-9">
				{values.map((value) =>
					value.id ? (
						<VVV
							key={value.id}
							value={value}
							setIsEditing={setIsEditing}
							pubId={pubId}
							formSlug={formSlug}
							isEditing={_isEditing}
						/>
					) : (
						// Blank space if there is no value
						<div className="h-1" key={value.fieldId} />
					)
				)}
			</div>
		</>
	)
}

const VVV = ({
	value,
	setIsEditing,
	pubId,
	formSlug,
	isEditing,
}: {
	value: FullProcessedPubWithForm["values"][number] & {
		formElementId: FormElementsId
		id: PubValuesId
	}
	setIsEditing: (isEditing: boolean) => void
	pubId: PubsId
	formSlug: string
	isEditing: boolean
}) => {
	const [val, setValue] = useState(value.value)

	return !isEditing ? (
		<PubValue
			value={{
				...value,
				value: val,
			}}
			key={value.id}
		/>
	) : (
		<MiniForm
			setValue={setValue}
			key={value.id}
			value={value}
			formSlug={formSlug}
			setIsEditing={setIsEditing}
			pubId={pubId}
		/>
	)
}

const MiniForm = ({
	value,
	setIsEditing,
	pubId,
	formSlug,
	setValue,
}: {
	value: FullProcessedPubWithForm["values"][number] & {
		formElementId: FormElementsId
		id: PubValuesId
	}
	setIsEditing: (isEditing: boolean) => void
	pubId: PubsId
	formSlug: string
	setValue: (value: unknown) => void
}) => {
	const miniForm = useForm({
		defaultValues: {
			[value.fieldSlug]: value.value,
		},
		resolver: typeboxResolver(
			Type.Object({
				[value.fieldSlug]: getJsonSchemaByCoreSchemaType(value.schemaName),
			})
		),
	})

	const runUpdatePub = useServerAction(updatePub)

	const onSubmit = async (values: Record<string, unknown>) => {
		console.log(values)
		setIsEditing(false)
		const oldValue = value.value
		setValue(values[value.fieldSlug] as unknown)
		const result = await runUpdatePub({
			pubId,
			continueOnValidationError: false,
			deleted: [],
			pubValues: {
				[value.fieldSlug]: values[value.fieldSlug] as JsonValue,
			},
			formSlug,
		})
		if (didSucceed(result)) {
			return
		}

		setIsEditing(true)
		setValue(oldValue)
	}

	return (
		<Form key={value.id} {...miniForm}>
			<form
				onSubmit={miniForm.handleSubmit(onSubmit)}
				className="flex w-full items-baseline justify-between gap-4 [&>div]:w-full [&_label]:sr-only"
			>
				<FormElement
					element={
						{
							type: ElementType.pubfield,
							component: value.formElementComponent,
							id: value.formElementId,
							fieldId: value.fieldId,
							label: value.formElementLabel,
							config: value.formElementConfig,
							schemaName: value.schemaName,
							isRelation: Boolean(value.relatedPubId),
							required: true,
							slug: value.fieldSlug,
						} as PubFieldElement
					}
					values={[value]}
					pubId={pubId}
				/>
				<FormSubmitButton
					size="sm"
					formState={miniForm.formState}
					idleText="Save"
					pendingText="Saving..."
					successText="Saved"
					errorText="Error saving"
				/>
			</form>
		</Form>
	)
}
