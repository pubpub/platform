import { DOMParser, DOMSerializer, Node } from "prosemirror-model";

import { logger } from "logger";

import { baseSchema } from "../schemas";

/**
 * Serialize a ProseMirror node to HTML
 *
 * Requires an alternative document (eg JSDOM) if running in a non-browser environment
 */
export const prosemirrorToHTML = (
	node: Node | { type: "doc"; content: any[] },
	document?: Document
): string => {
	const doc = document ?? global.document;

	if (!doc) {
		throw new Error(
			"No document specified. Please provide a document to the prosemirrorToHTML function. Environment: " +
				(typeof window !== "undefined" ? "browser" : "node")
		);
	}

	let toBeProcessedContent =
		node instanceof Node ? node.content : Node.fromJSON(baseSchema, node).content;

	const fragment = DOMSerializer.fromSchema(baseSchema).serializeFragment(toBeProcessedContent, {
		document: doc,
	});

	const container = doc.createElement("div");
	container.appendChild(fragment);

	return container.innerHTML;
};

/**
 * Deserialize HTML to a ProseMirror node
 *
 * Requires an alternative document (eg JSDOM) if running in a non-browser environment
 */
export const htmlToProsemirror = (html: string, document?: Document) => {
	const doc = document ?? global.document;

	if (!doc) {
		throw new Error(
			"No document specified. Please provide a document to the htmlToProsemirror function. Environment: " +
				(typeof window !== "undefined" ? "browser" : "node")
		);
	}

	let temp: HTMLDivElement | undefined;

	try {
		temp = doc.createElement("div");
		temp.innerHTML = html;

		const node = DOMParser.fromSchema(baseSchema).parse(temp);

		return node;
	} catch (e) {
		logger.error({
			msg: "Something went wrong during the rendering from HTML to ProseMirror",
			err: e,
		});
		throw e;
	} finally {
		if (temp) {
			temp.remove();
		}
	}
};
