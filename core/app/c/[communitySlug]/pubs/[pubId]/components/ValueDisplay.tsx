import type { ProcessedPubWithForm, User } from "contracts"
import type { InputTypeForCoreSchemaType } from "schemas"

import { ExternalLink } from "lucide-react"

import { CoreSchemaType, InputComponent } from "db/public"
import { Badge } from "ui/badge"
import { Checkbox } from "ui/checkbox"
import { ColorCircle, ColorValue } from "ui/color"
import { ShowMore } from "ui/show-more"
import { Slider } from "ui/slider"
import { cn } from "utils"

import { FileUploadPreview } from "~/app/components/forms/FileUpload"
import { PubCardClient, type PubCardClientPub } from "~/app/components/pubs/PubCard/PubCardClient"
import { UserDisplay } from "../../../UserDisplay"
import { DateTimeDisplay } from "./DateTimeDisplay"

type PubValue = ProcessedPubWithForm<{
	withRelatedPubs: true
	withStage: true
	withPubType: true
	withMembers: true
}>["values"][number]

type ValueDisplayProps = {
	values: PubValue[]
	isRelationEdgeValue?: boolean
}

export const ValueDisplay = ({ values, isRelationEdgeValue }: ValueDisplayProps) => {
	const firstValue = values[0]
	if (!firstValue || !firstValue.id) {
		return <div className="h-1" />
	}

	const isRelation = firstValue.relatedPubId !== null && !isRelationEdgeValue

	if (isRelation && "relatedPub" in firstValue) {
		return <RelationValueDisplay values={values} />
	}

	return <ScalarValueDisplay value={firstValue} />
}

type RelationValueDisplayProps = {
	values: PubValue[]
}

const RelationValueDisplay = ({ values }: RelationValueDisplayProps) => {
	return (
		<div className="grid grid-cols-1 flex-col gap-4 md:grid-cols-2">
			{values.map((value) => {
				if (!("relatedPub" in value) || !value.relatedPub) {
					return null
				}

				const hasEdgeValue = value.value !== null && value.value !== undefined

				return (
					<div key={value.id} className="flex flex-col gap-2 border-border">
						<PubCardClient
							showTime={false}
							pub={value.relatedPub as PubCardClientPub}
							selected={false}
							showCheckbox={false}
							className="w-full"
							bigLink={false}
						>
							{hasEdgeValue && (
								<div className="mb-1 border-border border-t pt-2">
									<ScalarValueDisplay value={value} isRelationEdgeValue={true} />
								</div>
							)}
						</PubCardClient>
					</div>
				)
			})}
		</div>
	)
}

type ScalarValueDisplayProps = {
	value: PubValue
	isRelationEdgeValue?: boolean
}

const ScalarValueDisplay = ({ value, isRelationEdgeValue }: ScalarValueDisplayProps) => {
	switch (value.schemaName) {
		case CoreSchemaType.String:
			return (
				<p
					className={cn(
						"prose-sm dark:prose-invert",
						isRelationEdgeValue ? "text-muted-foreground text-xs" : "text-sm"
					)}
				>
					{value.value as string}
				</p>
			)

		case CoreSchemaType.RichText:
			return (
				<ShowMore>
					<div
						className={cn(
							"prose-sm dark:prose-invert",
							isRelationEdgeValue ? "text-muted-foreground text-xs" : "text-sm"
						)}
						dangerouslySetInnerHTML={{ __html: value.value as string }}
					/>
				</ShowMore>
			)

		case CoreSchemaType.URL:
			return (
				<a
					href={value.value as string}
					className={cn(
						"flex items-center gap-1 text-blue-400 underline",
						isRelationEdgeValue ? "text-muted-foreground text-xs" : "text-sm"
					)}
					target="_blank"
					rel="noopener noreferrer"
				>
					{value.value as string} <ExternalLink size={14} />
				</a>
			)

		case CoreSchemaType.Email:
			return (
				<a
					href={`mailto:${value.value as string}`}
					className={cn(
						"text-blue-400 underline",
						isRelationEdgeValue ? "text-muted-foreground text-xs" : "text-sm"
					)}
				>
					{value.value as string}
				</a>
			)

		case CoreSchemaType.DateTime:
			return <DateTimeDisplay date={new Date(value.value as string)} type="absolute" />

		case CoreSchemaType.Color:
			return (
				<div
					className={cn(
						"flex h-full items-center gap-2",
						isRelationEdgeValue ? "text-muted-foreground text-xs" : "text-sm"
					)}
				>
					<span className="sr-only">Pick a color</span>
					<ColorCircle color={value.value as string} size="sm" />
					<ColorValue color={value.value as string} className="text-foreground text-xs" />
				</div>
			)

		case CoreSchemaType.FileUpload:
			return (
				<FileUploadPreview
					files={value.value as InputTypeForCoreSchemaType<CoreSchemaType.FileUpload>}
				/>
			)

		case CoreSchemaType.Boolean:
			return <Checkbox checked={value.value as boolean} />

		case CoreSchemaType.MemberId:
			return <UserDisplay user={value.value as User} />

		case CoreSchemaType.Vector3:
		case CoreSchemaType.NumericArray: {
			const isConfidenceInterval =
				"formElementComponent" in value &&
				value.formElementComponent === InputComponent.confidenceInterval

			if (isConfidenceInterval) {
				return (
					<Slider
						value={value.value as number[]}
						min={0}
						max={100}
						className="h-4 w-full"
						withThumbLabels="always"
					/>
				)
			}

			return (
				<div className="flex h-full items-center gap-2">
					<code className="text-xs">[{(value.value as number[]).join(", ")}]</code>
				</div>
			)
		}

		case CoreSchemaType.Number:
			return (
				<code
					className={cn(
						"font-mono",
						isRelationEdgeValue ? "text-muted-foreground text-xs" : "text-sm"
					)}
				>
					{value.value as number}
				</code>
			)

		case CoreSchemaType.StringArray:
			return (
				<div className="flex flex-wrap gap-1">
					{(value.value as string[]).map((str) => (
						<Badge key={str} className={cn(isRelationEdgeValue && "px-1.5 py-px")}>
							{str}
						</Badge>
					))}
				</div>
			)

		case CoreSchemaType.Null:
			return null

		default: {
			const _never: never = value.schemaName
			return <pre className="overflow-auto">{JSON.stringify(value.value, null, 2)}</pre>
		}
	}
}
