import { baseSchema } from "context-editor/schemas";
import { JSDOM } from "jsdom";
import { DOMParser, DOMSerializer, Node } from "prosemirror-model";

import { CoreSchemaType } from "db/public";

import { serializeProseMirrorDoc } from "../fields/richText";

export const prosemirrorToHTML = (node: Node | { type: "doc"; content: any[] }): string => {
	const dom = new JSDOM();
	const document = dom.window.document;

	let toBeProcessedContent =
		node instanceof Node ? node.content : Node.fromJSON(baseSchema, node).content;

	// necessary for rendering math, see `context-editor/schemas/math.ts`
	// also bc Prosemirror does not want to expose the `document` to `toDOM`, see https://discuss.prosemirror.net/t/getting-a-hold-of-the-document-used-by-prosemirror-from-todom/8392
	global.document = document;
	const fragment = DOMSerializer.fromSchema(baseSchema).serializeFragment(toBeProcessedContent, {
		document,
	});

	const container = document.createElement("div");
	container.appendChild(fragment);

	// @ts-expect-error "Operand of delete must be optional" shut up man
	delete global.document;

	return container.innerHTML;
};

export const htmlToProsemirror = (html: string) => {
	const dom = new JSDOM(html);

	const node = DOMParser.fromSchema(baseSchema).parse(dom.window.document);

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
				const node = htmlToProsemirror(value.value);

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
