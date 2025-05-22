import { htmlToProsemirror, prosemirrorToHTML } from "context-editor/utils/serialize";
import { JSDOM } from "jsdom";
import { Node } from "prosemirror-model";

import { CoreSchemaType } from "db/public";

import { serializeProseMirrorDoc } from "../fields/richText";

export const prosemirrorToHTMLServer = (node: Node | { type: "doc"; content: any[] }): string => {
	const dom = new JSDOM();
	const document = dom.window.document;

	// necessary for rendering math, see `context-editor/schemas/math.ts`
	// also bc Prosemirror does not want to expose the `document` to `toDOM`, see https://discuss.prosemirror.net/t/getting-a-hold-of-the-document-used-by-prosemirror-from-todom/8392
	global.document = document;

	const html = prosemirrorToHTML(node, document);

	// @ts-expect-error "Operand of delete must be optional" shut up man
	delete global.document;

	return html;
};

export const htmlToProsemirrorServer = (html: string) => {
	const dom = new JSDOM();

	const node = htmlToProsemirror(html, dom.window.document);

	return node;
};

/**
 * transforms all richtext values in a pub from html to prosemirror trees
 *
 * only up to depth 1
 */
export const transformRichTextValuesToProsemirror = <
	T extends {
		values: Array<{
			value: unknown;
			schemaName: CoreSchemaType;
		}>;
	},
>(
	pub: T,
	opts?: {
		toJson?: boolean;
	}
): T => {
	return {
		...pub,
		values: pub.values.map((value) => {
			if (value.schemaName === CoreSchemaType.RichText && typeof value.value === "string") {
				const node = htmlToProsemirrorServer(value.value);

				const maybeJSON = opts?.toJson ? serializeProseMirrorDoc(node) : node;
				return {
					...value,
					value: maybeJSON,
				};
			}
			return value;
		}),
	};
};
