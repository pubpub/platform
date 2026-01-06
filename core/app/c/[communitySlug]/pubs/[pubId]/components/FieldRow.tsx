"use client"

import type { ProcessedPubWithForm } from "contracts"
import type { CoreSchemaType, PubsId } from "db/public"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { SCHEMA_TYPES_WITH_ICONS } from "schemas"

import { Button } from "ui/button"
import { cn } from "utils"

import { InlineEditForm } from "./InlineEditForm"
import { ValueDisplay } from "./ValueDisplay"

// flexible type that works with hydrated values
export type PubValue = ProcessedPubWithForm<{
	withRelatedPubs: true
	withStage: true
	withPubType: true
	withMembers: true
}>["values"][number]

export type FieldRowProps = {
	pubId: PubsId
	formSlug: string
	name: string
	slug: string
	schemaType: CoreSchemaType
	values: PubValue[]
	depth: number
	/** if this is showing an edge value on a relation */
	isRelationEdgeValue?: boolean
}

export const FieldRow = ({
	pubId,
	formSlug,
	name,
	slug,
	schemaType,
	values,
	depth,
	isRelationEdgeValue,
}: FieldRowProps) => {
	const [isEditing, setIsEditing] = useState(false)

	const slugWithoutCommunity = slug.split(":").pop() ?? slug
	const SchemaTypeIcon = SCHEMA_TYPES_WITH_ICONS[schemaType]?.icon

	const hasFormElement = values[0] && "formElementComponent" in values[0]
	const canEdit = hasFormElement && !isRelationEdgeValue

	if (!values.length || !values[0]) {
		return null
	}

	return (
		<div className="group relative col-span-14 grid grid-cols-12 gap-x-1">
			<FieldHeader
				name={name}
				slug={slugWithoutCommunity}
				depth={depth}
				SchemaTypeIcon={SchemaTypeIcon}
				isRelationEdgeValue={isRelationEdgeValue}
				className="col-span-2 col-start-2"
			/>
			<div className="col-span-8 mt-1" data-testid={`${name}-value`}>
				{isEditing && canEdit ? (
					<InlineEditForm
						values={values}
						formSlug={formSlug}
						pubId={pubId}
						onClose={() => setIsEditing(false)}
					/>
				) : (
					<ValueDisplay values={values} isRelationEdgeValue={isRelationEdgeValue} />
				)}
			</div>
			{canEdit && !isEditing && (
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"absolute top-1 right-8 translate-x-full text-muted-foreground/50",
						"opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex"
					)}
					onClick={() => setIsEditing(true)}
					aria-label="Edit field"
				>
					<Pencil size={14} className="text-muted-foreground/50" />
				</Button>
			)}
		</div>
	)
}

const FieldHeader = ({
	name,
	slug,
	depth,
	SchemaTypeIcon,
	isRelationEdgeValue,
	className,
}: {
	name: string
	slug: string
	depth: number
	SchemaTypeIcon?: React.ComponentType<{ className: string }>
	isRelationEdgeValue?: boolean
	className?: string
}) => {
	if (isRelationEdgeValue) {
		return null
	}

	return (
		<div className={cn("flex flex-col gap-0", className)}>
			<FieldHeading depth={depth} className="font-medium">
				{name}
			</FieldHeading>
			<div className="flex items-center gap-1">
				{SchemaTypeIcon && (
					<SchemaTypeIcon className="size-3 text-muted-foreground md:size-3.5" />
				)}
				<code className="truncate text-muted-foreground text-xs">{slug}</code>
			</div>
		</div>
	)
}

const FieldHeading = ({
	depth,
	children,
	...props
}: React.HTMLAttributes<HTMLHeadingElement> & { depth: number }) => {
	// depth starts at 0 for top-level fields
	const level = Math.max(0, depth)
	switch (level) {
		case 0:
			return <h3 {...props}>{children}</h3>
		case 1:
			return <h4 {...props}>{children}</h4>
		case 2:
			return <h5 {...props}>{children}</h5>
		default:
			return <h6 {...props}>{children}</h6>
	}
}
