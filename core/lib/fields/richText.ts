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

interface GetPubValuesReturnType {
	[pubId: string]: {
		parentPubId: string;
		pubId: string;
		pubTypeId: string;
		values: {
			[fieldSlug: string]: {
				type: string;
				attrs: {
					id: string | null;
					class: string | null;
				};
				content: {
					type: string;
					text: string;
				}[];
			}[];
		};
	};
}

interface PubCreate {
	id: string;
	pubTypeId: string;
	values: {
		[fieldSlug: string]: any;
	};
}

/**
 * Parse rich text values to get values (overwritten pubfields) and children (related pubs)
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
export const parseRichTextForPubFieldsAndPubChildren = ({
	pubId,
	elements,
	newValues,
}: {
	pubId: PubsId;
	elements: { slug: string; schemaName: CoreSchemaType }[];
	newValues: Record<string, JsonValue>;
}) => {
	const richTextElement = elements.filter((e) => e.schemaName === CoreSchemaType.RichText)[0];
	// If there is no rich text field, do not alter any fields
	if (!richTextElement) {
		return newValues;
	}
	const richTextValue = newValues[richTextElement.slug];
	if (!richTextValue) {
		return newValues;
	}
	const editorPubValues: GetPubValuesReturnType = getPubValues(
		{ doc: richTextValue } as any,
		pubId
	);
	const payload: Record<string, JsonValue> = { ...newValues };
	const pubs: PubCreate[] = [];
	Object.entries(editorPubValues).map(([pubId, data]) => {
		// This is a pubfield addition
		if (pubId === "") {
			const { values } = data;
			// TODO: what to do about multiple values in a field? Currently just joining on a comma
			Object.entries(values).map(([fieldSlug, fieldValues]) => {
				payload[fieldSlug] = fieldValues
					.map((fieldValue) => fieldValue.content.map((c) => c.text).join(", "))
					.join(", ");
			});
		} else {
			// do we need to pass parent pub id?
			const { pubId, parentPubId, ...pub } = data;
			pubs.push({ id: pubId, ...pub });
		}
	});

	return { values: payload, children: pubs };
};
