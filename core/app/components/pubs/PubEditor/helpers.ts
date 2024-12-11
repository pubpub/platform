import type { FormElementsId } from "db/public";
import { ElementType } from "db/public";

import type { Form } from "~/lib/server/form";
import type { PubField } from "~/lib/types";

// Function to create an element object based on pubType parameter
export function makeFormElementDefFromPubFields(
	pubFields: Pick<PubField, "id" | "name" | "slug" | "schemaName">[]
): Form["elements"][number][] {
	return pubFields.map((field, index) => ({
		slug: field.slug || null,
		schemaName: field.schemaName || null,
		type: ElementType.pubfield,
		order: index + 1,
		description: field.name || null,
		stageId: null,
		fieldId: field.id || null,
		label: field.name || null,
		element: null,
		content: null,
		required: false,
		elementId: field.id as unknown as FormElementsId, // use field.id?
		component: null,
		config: {},
	}));
}
