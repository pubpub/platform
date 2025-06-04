import mudder from "mudder";
import { defaultComponent } from "schemas";

import type { FormInputsId } from "db/public";

import type { BasicInputElement } from "../../forms/types";
import type { DefinitelyHas, PubField } from "~/lib/types";

// Function to create an element object based on pubType parameter
export function makeFormElementDefFromPubFields(
	pubFields: Pick<PubField, "id" | "name" | "slug" | "schemaName">[]
): BasicInputElement[] {
	return pubFields
		.filter((field): field is DefinitelyHas<typeof field, "schemaName"> => !!field.schemaName)
		.map(
			(field, index) =>
				({
					// this is kind of evil
					id: field.id as unknown as FormInputsId, // use field.id?
					slug: field.slug,
					schemaName: field.schemaName,
					rank: mudder.base62.numberToString(index + 1),
					fieldId: field.id,
					label: field.name ?? null,
					required: false,
					component: defaultComponent(field.schemaName),
					config: {},
					relatedPubTypes: [],
					fieldName: field.name,
					isRelation: false,
				}) as BasicInputElement
		);
}
