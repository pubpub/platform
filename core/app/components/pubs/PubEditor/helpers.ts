import { defaultComponent } from "schemas";

import type { FormElementsId } from "db/public";
import { ElementType } from "db/public";

import type { BasicFormElements, BasicPubFieldElement } from "../../forms/types";
import type { DefinitelyHas, PubField } from "~/lib/types";

// Function to create an element object based on pubType parameter
export function makeFormElementDefFromPubFields(
	pubFields: Pick<PubField, "id" | "name" | "slug" | "schemaName">[]
): BasicFormElements[] {
	return pubFields
		.filter((field): field is DefinitelyHas<typeof field, "schemaName"> => !!field.schemaName)
		.map(
			(field, index) =>
				({
					// this is kind of evil
					id: field.id as unknown as FormElementsId, // use field.id?
					slug: field.slug,
					schemaName: field.schemaName,
					type: ElementType.pubfield,
					order: index + 1,
					stageId: null,
					fieldId: field.id,
					label: field.name ?? null,
					element: null,
					content: null,
					required: false,
					component: defaultComponent(field.schemaName),
					config: {},
				}) as BasicPubFieldElement
		);
}
