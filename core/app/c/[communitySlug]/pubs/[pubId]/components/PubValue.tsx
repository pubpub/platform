import type { User } from "contracts"
import type { FileUploadFile } from "~/lib/fields/fileUpload"
import type { FullProcessedPubWithForm } from "~/lib/server"

import { ExternalLink } from "lucide-react"

import { CoreSchemaType, InputComponent } from "db/public"
import { Badge } from "ui/badge"
import { Checkbox } from "ui/checkbox"
import { ColorCircle, ColorValue } from "ui/color"
import { ShowMore } from "ui/show-more"
import { Slider } from "ui/slider"

import { FileUploadPreview } from "~/app/components/forms/FileUpload"
import { PubCardClient, type PubCardClientPub } from "~/app/components/pubs/PubCard/PubCardClient"
import { UserDisplay } from "../../../UserDisplay"
import { DateTimeDisplay } from "./DateTimeDisplay"

export const PubValueDisplay = ({ values }: { values: FullProcessedPubWithForm["values"] }) => {
	const value = values[0]
	if (!value) {
		return <div className="h-1" />
	}

	const isRelation = value.relatedPubId !== null

	if (!value.id) {
		return <div className="h-1" />
	}

	if (isRelation && "formElementLabel" in value && "value" in value) {
		return values.map((v) => (
			<PubCardClient
				pub={v.relatedPub as PubCardClientPub}
				selected={false}
				showCheckbox={false}
				className="w-full"
				bigLink={false}
				key={value.id}
			/>
		))
	}

	switch (value.schemaName) {
		case CoreSchemaType.String:
			return (
				<p key={value.id} className="prose-sm dark:prose-invert text-sm">
					{value.value as string}
				</p>
			)
		case CoreSchemaType.RichText:
			return (
				<ShowMore key={value.id}>
					<div
						className="prose dark:prose-invert text-sm"
						dangerouslySetInnerHTML={{ __html: value.value as string }}
					/>
				</ShowMore>
			)

		case CoreSchemaType.URL:
			return (
				<a
					key={value.id}
					href={value.value as string}
					className="flex items-center gap-1 text-blue-400 underline"
					target="_blank"
					rel="noopener noreferrer"
				>
					{value.value as string} <ExternalLink size={14} />
				</a>
			)
		case CoreSchemaType.Email:
			return (
				<a
					key={value.id}
					href={`mailto:${value.value as string}`}
					className="text-blue-400 underline"
				>
					{value.value as string}
				</a>
			)
		case CoreSchemaType.DateTime:
			return (
				<DateTimeDisplay
					key={value.id}
					date={new Date(value.value as string)}
					type="absolute"
				/>
			)
		case CoreSchemaType.Color:
			return (
				<div className="flex h-full items-center gap-2">
					<span className="sr-only">Pick a color</span>
					<ColorCircle color={value.value as string} size="sm" />
					<ColorValue color={value.value as string} className="text-foreground text-xs" />
				</div>
			)
		case CoreSchemaType.FileUpload:
			return <FileUploadPreview files={value.value as (FileUploadFile & { id: string })[]} />
		case CoreSchemaType.Boolean:
			return <Checkbox checked={value.value as boolean} />
		case CoreSchemaType.MemberId:
			return <UserDisplay user={value.value as User} />
		case CoreSchemaType.Vector3:
		case CoreSchemaType.NumericArray:
			if (
				"formElementComponent" in value &&
				value.formElementComponent === InputComponent.confidenceInterval
			) {
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
		case CoreSchemaType.Number:
			return <code className="text-xs">{value.value as number}</code>
		case CoreSchemaType.StringArray:
			return (value.value as string[]).map((str) => <Badge key={str}>{str}</Badge>)
		case CoreSchemaType.Null:
			return null
		default: {
			const _never: never = value.schemaName
			return (
				<pre key={value.id} className="overflow-auto">
					{JSON.stringify(value.value, null, 2)}
				</pre>
			)
		}
	}

	// return <div>

	// 	<div className="font-semibold text-base">{value.fieldName}</div>
	// 	<div>{value.value}</div>
	// </div>
}
