import { htmlToProsemirror } from "context-editor/utils/serialize"

import { CoreSchemaType } from "db/public"

type PubLike = { values: { value: unknown; schemaName: CoreSchemaType }[] }

export const transformRichTextValuesToProsemirrorClient = <T extends PubLike>(pub: T): T => {
	return {
		...pub,
		values: pub.values.map((value) => {
			if (value.schemaName === CoreSchemaType.RichText && typeof value.value === "string") {
				const pmNode = htmlToProsemirror(value.value)
				// convert to plain json to avoid circular references in prosemirror node objects
				// which cause react-hook-form's deepEqual to infinite loop
				const pmJson = pmNode.toJSON()
				return {
					...value,
					value: pmJson,
				}
			}
			return value
		}),
	}
}
