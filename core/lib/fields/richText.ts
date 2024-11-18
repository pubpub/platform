import { baseSchema, getPubValues } from "context-editor";
import { Node } from "prosemirror-model";

import type { JsonValue } from "contracts";
import type { PubsId } from "db/public";
import { CoreSchemaType } from "db/public";
import { logger } from "logger";

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

type Field = {
	slug: string;
	value: JsonValue;
};

type FieldWithSchema = Field & {
	schemaName: CoreSchemaType | null;
};
type RichTextValue = {
	slug: string;
	schemaName: CoreSchemaType.RichText;
	value: Node;
};

const fieldRecordToArray = (record: Record<string, JsonValue>) => {
	return Object.entries(record).flatMap(([slug, value]) => ({
		slug,
		value,
	}));
};

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
 * TODO: what to do about multiple rich text fields?
 * TODO: we can't fill out the Submission pub type without ContextAtom rendering first
 */
export const parseRichTextForPubFieldsAndRelatedPubs = ({
	pubId,
	values,
}: {
	pubId: PubsId;
	values: FieldWithSchema[];
}) => {
	const pubs: PubCreate[] = [];

	// Separate out rich text values from the rest of the payload
	const { richText, payload } = values.reduce<{
		richText: RichTextValue[];
		payload: Record<string, JsonValue>;
	}>(
		(acc, e) => {
			if (e.schemaName === CoreSchemaType.RichText) {
				try {
					const rt = { ...e, value: baseSchema.nodeFromJSON(e.value) };
					acc.richText.push(rt as RichTextValue);
				} catch (error) {
					logger.error(error);
					throw new Error(`Could not convert ${e.slug} to prosemirror node`);
				}
			}
			acc.payload[e.slug!] = e.value as JsonValue;
			return acc;
		},
		{ richText: [], payload: {} }
	);
	// If there are no rich text fields, return the payload as is
	if (!richText.length) {
		return { values: fieldRecordToArray(payload), relatedPubs: pubs };
	}

	// TODO: how to handle multiple rich text fields?
	const firstRichTextElement = richText[0];
	const richTextValue = firstRichTextElement.value;

	const editorPubValues = getPubValues({ doc: richTextValue }, pubId);

	for (const [nodePubId, data] of Object.entries(editorPubValues)) {
		// This is a related pub
		if (nodePubId !== pubId) {
			const { pubId, parentPubId, ...pub } = data;
			pubs.push({ id: pubId, ...pub });
			continue;
		}

		// Field on the current pub
		const { values: editorValues } = data;
		for (const [fieldSlug, fieldValues] of Object.entries(editorValues)) {
			if (!Array.isArray(fieldValues)) {
				payload[fieldSlug] = fieldValues;
				continue;
			}
			// This is a DocValue, which we parse through the content fields
			// TODO: We currently just do a concat on all the text fields, assuming we want a string.
			// May want to check that this schemaName === String first? This is kinda equivalent to what is
			// hardcoded in https://github.com/pubpub/platform/blob/1de6413bbc18283f40e058c7bf4db2c762d5aedf/packages/context-editor/src/utils/pubValues.ts#L51
			payload[fieldSlug] = fieldValues
				.map((fieldValue) => fieldValue.content.map((c) => c.text).join(", "))
				.join(", ");
		}
	}

	return {
		values: fieldRecordToArray(payload),
		relatedPubs: pubs,
	};
};
