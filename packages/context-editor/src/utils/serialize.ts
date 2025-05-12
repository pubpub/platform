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
 */
export const htmlToProsemirror = (html: string) => {
	let temp: HTMLDivElement | undefined;
	console.log("hello");
	try {
		// create temp element
		temp = window.document.createElement("div");
		console.log(temp);
		temp.innerHTML = html;
		const node = DOMParser.fromSchema(baseSchema).parse(temp);

		return node;
	} catch (e) {
		console.error("Something went wrong during the rendering from HTML to ProseMirror");
		// console.error(e);
		throw new Error(e);
	} finally {
		if (temp) {
			temp.remove();
		}
	}
};
