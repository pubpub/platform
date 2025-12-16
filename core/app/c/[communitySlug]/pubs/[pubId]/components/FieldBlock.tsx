"use client"

import type { PubFieldElement } from "~/app/components/forms/types"
import type { FullProcessedPubWithForm } from "~/lib/server"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { defaultComponent, SCHEMA_TYPES_WITH_ICONS } from "schemas"

import {
	type CoreSchemaType,
	ElementType,
	type FormElementsId,
	type PubsId,
	type PubTypesId,
} from "db/public"
import { Button } from "ui/button"
import { useIsMobile } from "ui/hooks"
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover"
import { FormSubmitButton } from "ui/submit-button"
import { cn } from "utils"

import { FormElement } from "~/app/components/forms/FormElement"
import { PubEditorClient } from "~/app/components/pubs/PubEditor/PubEditorClient"
import { DateTimeDisplay } from "./DateTimeDisplay"
import { PubValueDisplay } from "./PubValue"

/**
 * Get the label a form/pub value combo might have. In preference order:
 * 1. "label" on a FormElement
 * 2. "config.label" on a FormElement
 * 3. the name of the PubField
 **/
const getLabel = (value: FullProcessedPubWithForm["values"][number]) => {
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
	const slugWithoutCommunity = slug.split(":").pop()
	const SchemaTypeIcon = SCHEMA_TYPES_WITH_ICONS[schemaType]?.icon

	const [isEditing, setIsEditing] = useState(false)
	const firstValue = values[0]

	const label = getLabel(firstValue)

	const _isMobile = useIsMobile()
	const [isOpen, setIsOpen] = useState(false)

	return (
		<>
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger
					asChild
					onClick={(e) => {
						if (isEditing) {
							e.preventDefault()
							setIsEditing(false)
							return
						}
						setIsOpen((prev) => !prev)
					}}
				>
					<div className="group relative col-span-4 col-start-1 flex min-h-10 flex-col items-start gap-0 overflow-ellipsis md:col-span-2 md:col-start-2">
						<div className="line-clamp-1 w-[90%] truncate">
							<PubValueHeading depth={depth} className="truncate font-medium">
								{label}
							</PubValueHeading>
						</div>
						<div className="line-clamp-1 flex w-full items-end gap-1">
							{SchemaTypeIcon && (
								<SchemaTypeIcon className="size-3 text-muted-foreground md:size-4" />
							)}
							<code className="w-full truncate text-muted-foreground text-xs">
								{slugWithoutCommunity}
							</code>
						</div>
					</div>
				</PopoverTrigger>
				<PopoverContent
					side="right"
					align="start"
					sideOffset={-80}
					className="flex h-auto w-[80vw] flex-col gap-4 md:w-72"
				>
					<div className="flex flex-col gap-2">
						<PubValueHeading depth={depth} className="truncate font-medium">
							{label}
						</PubValueHeading>
						<div className="line-clamp-1 flex w-full items-end gap-1">
							{SchemaTypeIcon && (
								<SchemaTypeIcon className="size-3 text-muted-foreground md:size-4" />
							)}
							<code className="w-full truncate text-muted-foreground text-xs">
								{slug}
							</code>
						</div>
						<DateTimeDisplay
							className="text-muted-foreground text-xs"
							date={new Date(values?.[0].updatedAt ?? new Date())}
							type="relative"
						/>
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="ml-auto"
						onClick={(e) => {
							e.preventDefault()
							setIsEditing(true)
							setIsOpen(false)
						}}
					>
						Edit
					</Button>
				</PopoverContent>
			</Popover>
			<div
				data-testid={`${name}-value`}
				className="group relative col-span-8 md:col-span-8 lg:col-span-6"
			>
				<VVV
					values={values}
					setIsEditing={setIsEditing}
					pubId={pubId}
					formSlug={formSlug}
					isEditing={isEditing}
				/>
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"-right-2 absolute top-1 hidden translate-x-full text-muted-foreground/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex",
						isEditing && "md:hidden"
					)}
					onClick={(e) => {
						e.preventDefault()
						setIsEditing(true)
						setIsOpen(false)
					}}
					aria-label="Edit field"
				>
					<Pencil size={14} className="text-muted-foreground/50" />
				</Button>
			</div>
		</>
	)
}

const VVV = ({
	values,
	setIsEditing,
	pubId,
	formSlug,
	isEditing,
}: {
	values: FullProcessedPubWithForm["values"]
	setIsEditing: (isEditing: boolean) => void
	pubId: PubsId
	formSlug: string
	isEditing: boolean
}) => {
	const firstValue = values[0]
	if (!isEditing || !("formElementComponent" in firstValue)) {
		return <PubValueDisplay values={values} />
	}

	if (!values.length) {
		return <div className="h-1" key={firstValue.fieldId} />
	}

	return (
		<MiniForm values={values} formSlug={formSlug} setIsEditing={setIsEditing} pubId={pubId} />
	)
}

const MiniForm = ({
	values,
	setIsEditing,
	pubId,
	formSlug,
}: {
	values: FullProcessedPubWithForm["values"]
	setIsEditing: (isEditing: boolean) => void
	pubId: PubsId
	formSlug: string
}) => {
	const fieldAsElements = values.map((v) => {
		if ("formElementComponent" in v) {
			return {
				type: ElementType.pubfield,
				component: v.formElementComponent,
				id: v.formElementId,
				fieldId: v.fieldId,
				label: v.formElementLabel,
				config: v.formElementConfig,
				schemaName: v.schemaName,
				isRelation: Boolean(v.relatedPubId),
				required: true,
				slug: v.fieldSlug,
				relatedPubTypes: v.formElementRelatedPubTypes,
			} as PubFieldElement
		}

		// should probably not allow you to edit this
		return {
			id: "a" as FormElementsId,
			fieldName: v.fieldName,
			content: null,
			stageId: null,
			element: null,
			rank: "",
			type: ElementType.pubfield,
			component: defaultComponent(v.schemaName),
			fieldId: v.fieldId,
			label: v.fieldName,
			config: {},
			schemaName: v.schemaName,
			isRelation: Boolean(v.relatedPubId),
			required: true,
			slug: v.fieldSlug,
			relatedPubTypes: [],
		} as PubFieldElement
	})

	const actualValues = values.filter((v) => v.id !== null)

	return (
		<PubEditorClient
			withAutoSave={false}
			withButtonElements={false}
			className="[&_label]:sr-only"
			mode="edit"
			pub={{
				id: pubId,
				values: actualValues,
				pubTypeId: "xxx" as PubTypesId,
			}}
			onSuccess={() => {
				setIsEditing(false)
			}}
			formSlug={formSlug}
			elements={fieldAsElements}
		>
			{(formInstance) => (
				<>
					<FormElement element={fieldAsElements[0]} values={actualValues} pubId={pubId} />
					<FormSubmitButton
						size="sm"
						formState={formInstance.formState}
						idleText="Save"
						pendingText="Saving..."
						successText="Saved"
						errorText="Error saving"
						className="-right-2 absolute top-0 translate-x-full"
					/>
				</>
			)}
		</PubEditorClient>
	)
}
