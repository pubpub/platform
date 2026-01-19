import { htmlToProsemirror } from "context-editor/utils/serialize"

import { CoreSchemaType } from "db/public"

type PubLike = { values: { value: unknown; schemaName: CoreSchemaType }[] }

export const transformRichTextValuesToProsemirrorClient = <T extends PubLike>(pub: T): T => {
	return {
		...pub,
		values: pub.values.map((value) => {
			if (value.schemaName === CoreSchemaType.RichText && typeof value.value === "string") {
				return {
					...value,
					value: htmlToProsemirror(value.value),
				}
			}
			return value
		}),
	}
}
