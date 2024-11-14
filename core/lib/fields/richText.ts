import type { Node } from "prosemirror-model";

import { getPubValues } from "context-editor";

import type { JsonValue } from "contracts";
import type { PubsId } from "db/public";
import { CoreSchemaType } from "db/public";

/**
 * In order to pass a prosemirror Node to a server action,
 * we have to transform it to a serializable JSON
 */
export const serializeProseMirrorDoc = (value: Node) => {
	// We stringify and then parse in order to make it a plain JSON object
	return JSON.parse(JSON.stringify(value.toJSON()));
};

interface PubCreate {
	id: string;
	pubTypeId: string;
	values: {
		[fieldSlug: string]: any;
	};
}

/**
 * Parse rich text values to get values (overwritten pubfields) and related pubs
 * in order to pass into a `createPub` function.
 *
 * If an editor has something like
 *
 * paragraph
 * _______
 * | My content here
 *
 * /Submission (pub type)
 * _______
 * |
 *
 * /Title (pub field)
 * _______
 * | My new title
 *
 * This would return a new "Submission" pub with empty fields in children,
 * and a new title field in values (i.e. {"croccroc:title":"My new title" })
 *
 * TODO: can the paragraph content "My content here" just stay in the RichText field?
 * TODO: we can't fill out the Submission pub type without ContextAtom rendering first
 */
export const parseRichTextForPubFieldsAndRelatedPubs = ({
	pubId,
	elements,
	newValues,
}: {
	pubId: PubsId;
	elements: { slug: string | null; schemaName: CoreSchemaType | null }[];
	newValues: Record<string, JsonValue>;
}) => {
	const payload: Record<string, JsonValue> = { ...newValues };
	const pubs: PubCreate[] = [];
	const richTextElement = elements.filter((e) => e.schemaName === CoreSchemaType.RichText)[0];
	// If there is no rich text field, do not alter any fields
	if (!richTextElement || !richTextElement.slug) {
		return { values: payload, relatedPubs: pubs };
	}
	const richTextValue = newValues[richTextElement.slug];
	if (!richTextValue) {
		return { values: payload, relatedPubs: pubs };
	}
	const editorPubValues = getPubValues({ doc: richTextValue } as any, pubId);

	Object.entries(editorPubValues).map(([nodePubId, data]) => {
		// Field on the current pub
		if (nodePubId === pubId) {
			const { values } = data;
			Object.entries(values).map(([fieldSlug, fieldValues]) => {
				// This is a DocValue, which we parse through the content fields
				// TODO: We currently just do a concat on all the text fields, assuming we want a string.
				// May want to check that this schemaName === String first? This is kinda equivalent to what is
				// hardcoded in https://github.com/pubpub/platform/blob/1de6413bbc18283f40e058c7bf4db2c762d5aedf/packages/context-editor/src/utils/pubValues.ts#L51
				if (Array.isArray(fieldValues)) {
					payload[fieldSlug] = fieldValues
						.map((fieldValue) => fieldValue.content.map((c) => c.text).join(", "))
						.join(", ");
				} else {
					payload[fieldSlug] = fieldValues;
				}
			});
			// This is a related pub
		} else {
			// do we need to pass parent pub id?
			const { pubId, parentPubId, ...pub } = data;
			pubs.push({ id: pubId, ...pub });
		}
	});

	return { values: payload, relatedPubs: pubs };
};
