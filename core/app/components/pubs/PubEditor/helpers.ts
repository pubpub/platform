import type { FormElementsId } from "db/public"
import type { DefinitelyHas } from "utils/types"
import type { PubField } from "~/lib/types"
import type { BasicPubFieldElement } from "../../forms/types"

import mudder from "mudder"
import { defaultComponent } from "schemas"

import { ElementType } from "db/public"

// Function to create an element object based on pubType parameter
export function makeFormElementDefFromPubFields(
	pubFields: Pick<PubField, "id" | "name" | "slug" | "schemaName">[]
): BasicPubFieldElement[] {
	return pubFields
		.filter((field): field is DefinitelyHas<typeof field, "schemaName"> => !!field.schemaName)
		.map(
			(field, index) =>
				({
					// this is kind of evil
					id: field.id as unknown as FormElementsId, // use field.id?
					slug: field.slug,
					schemaName: field.schemaName,
					fieldName: field.name,
					type: ElementType.pubfield,
					rank: mudder.base62.numberToString(index + 1),
					stageId: null,
					fieldId: field.id,
					label: field.name ?? null,
					element: null,
					content: null,
					required: false,
					component: defaultComponent(field.schemaName),
					config: {},
					relatedPubTypes: [],
					isRelation: false,
				}) as BasicPubFieldElement
		)
}
