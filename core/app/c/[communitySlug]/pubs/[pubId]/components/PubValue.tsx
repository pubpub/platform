import type { User } from "contracts"
import type { FileUploadFile } from "~/lib/fields/fileUpload"
import type { FullProcessedPubWithForm } from "~/lib/server"

import { CoreSchemaType } from "db/public"
import { Badge } from "ui/badge"
import { Checkbox } from "ui/checkbox"
import { ColorCircle, ColorValue } from "ui/color"
import { ShowMore } from "ui/show-more"

import { FileUploadPreview } from "~/app/components/forms/FileUpload"
import { UserDisplay } from "../../../UserDisplay"
import { DateTimeDisplay } from "./DateTimeDisplay"

export const PubValue = ({ value }: { value: FullProcessedPubWithForm["values"][number] }) => {
	if (value.value === null) {
		return "-"
	}

	switch (value.schemaName) {
		case CoreSchemaType.String:
			return (
				<p key={value.id} className="prose dark:prose-invert text-sm">
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
				<a key={value.id} href={value.value as string} className="text-blue-500 underline">
					{value.value as string}
				</a>
			)
		case CoreSchemaType.Email:
			return (
				<a
					key={value.id}
					href={`mailto:${value.value as string}`}
					className="text-blue-500 underline"
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
					<ColorValue
						color={value.value as string}
						className="text-muted-foreground text-xs"
					/>
				</div>
			)
		case CoreSchemaType.FileUpload:
			return <FileUploadPreview files={value.value as FileUploadFile[]} />
		case CoreSchemaType.Boolean:
			return <Checkbox checked={value.value as boolean} />
		case CoreSchemaType.MemberId:
			return <UserDisplay user={value.value as User} />
		case CoreSchemaType.Vector3:
		case CoreSchemaType.NumericArray:
			return (
				<div className="flex h-full items-center gap-2">
					<code className="text-xs">[{value.value.join(", ")}]</code>
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
