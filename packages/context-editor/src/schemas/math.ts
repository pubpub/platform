import type { Node, NodeSpec } from "prosemirror-model";

import { renderToString } from "katex";

import { tryCatch } from "utils/try-catch";

const renderMath = (node: Node, type: "math-inline" | "math-display") => {
	const [err, renderedKatex] = tryCatch(() =>
		renderToString(node.textContent, { output: "mathml" })
	);

	const content = err ? `<span class="parse-error">(math error)</span>` : renderedKatex;

	// this is not nice, i would like to avoid manually calling `document.createElement`
	// as we now need to keep track of setting `global.document` when this is called on the server
	// forturnately, we only really server render the HTML when importing Legacy text content
	// could be easily solved if `toDOM` was passed the document object, but ProseMirror does not seem to intend providing this
	// https://discuss.prosemirror.net/t/getting-a-hold-of-the-document-used-by-prosemirror-from-todom/8392
	if (!global.document) {
		throw new Error(
			"document not found. Trying to serialize math in a non-browser environment. To do this, set `global.document` to eg a `JSDOM` document before serializing."
		);
	}

	const element =
		type === "math-inline"
			? global.document.createElement("span")
			: global.document.createElement("div");
	element.innerHTML = content;

	return [
		type,
		{
			className: type,
		},
		element.childNodes[0],
	] as const;
};

const mathInline = {
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	content: "text*",
	group: "inline math",
	inline: true,
	atom: true,
	parseDOM: [
		{
			tag: "math-inline",
			contentElement: "annotation",
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: "math-inline", // need to set manually bc `annotation` does not have `math-inline` class
				};
			},
		},
	],
	toDOM: (node: Node) => renderMath(node, "math-inline"),
} satisfies NodeSpec;

const mathDisplay = {
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	group: "block math",
	content: "text*",
	atom: true,
	code: true,
	parseDOM: [
		{
			tag: "math-display",
			contentElement: "annotation",
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: "math-display", // need to set manually bc `annotation` does not have `math-display` class
				};
			},
		},
	],
	toDOM: (node: Node) => renderMath(node, "math-display"),
} satisfies NodeSpec;

export default {
	math_inline: mathInline,
	math_display: mathDisplay,
};
