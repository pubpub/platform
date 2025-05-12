import { DOMParser, DOMSerializer, Node } from "prosemirror-model";

import { baseSchema } from "../schemas";

/**
 * Serialize a ProseMirror node to HTML
 *
 * Only works in a valid browser environment
 */
export const prosemirrorToHTML = (node: Node): string => {
	const fragment = DOMSerializer.fromSchema(baseSchema).serializeFragment(node.content);

	const container = document.createElement("div");
	container.appendChild(fragment);

	return container.innerHTML;
};

/**
 * Deserialize HTML to a ProseMirror node
 *
 * Only works in a valid browser environment
 *
 * @throws {Error} If the HTML is invalid. Use `tryCatch` to catch the error.
 */
export const htmlToProsemirror = (html: string) => {
	let temp: HTMLDivElement | undefined;
	try {
		// create temp element
		temp = window.document.createElement("div");
		temp.innerHTML = html;
		const node = DOMParser.fromSchema(baseSchema).parse(temp);

		return node;
	} catch (e) {
		console.error("Something went wrong during the rendering from HTML to ProseMirror", e);
		throw e;
	} finally {
		if (temp) {
			temp.remove();
		}
	}
};
