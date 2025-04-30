import { baseSchema } from "context-editor/schemas";
import { DOMParser, DOMSerializer, Node } from "prosemirror-model";

export const renderNodeToHTML = (node: Node): string => {
	const fragment = DOMSerializer.fromSchema(baseSchema).serializeFragment(node.content);

	const container = document.createElement("div");
	container.appendChild(fragment);

	return container.innerHTML;
};

export const fromHTMLToNode = (html: string) => {
	let temp: HTMLDivElement | undefined;
	try {
		// create temp element
		temp = window.document.createElement("div");
		temp.innerHTML = html;
		const node = DOMParser.fromSchema(baseSchema).parse(temp);

		return node;
	} catch (e) {
		console.error(e);
	} finally {
		if (temp) {
			temp.remove();
		}
	}
};
