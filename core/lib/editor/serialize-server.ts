import { baseSchema } from "context-editor/schemas";
import { JSDOM } from "jsdom";
import { DOMParser, DOMSerializer, Node } from "prosemirror-model";

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
