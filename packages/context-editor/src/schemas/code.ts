import type { DOMOutputSpec, MarkSpec, Node, NodeSpec } from "prosemirror-model";

const codeInline = {
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	parseDOM: [{ tag: "code" }],
	toDOM: (mark) => {
		return [
			"code",
			{
				class: mark.attrs.class,
				...(mark.attrs.id && { id: mark.attrs.id }),
			},
		] as DOMOutputSpec;
	},
} satisfies MarkSpec;

const codeBlock = {
	content: "text*",
	group: "block",
	attrs: {
		lang: { default: null },
		id: { default: null },
		class: { default: null },
	},
	code: true,
	selectable: false,
	parseDOM: [
		{
			tag: "pre",
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
				};
			},
			preserveWhitespace: "full" as const,
		},
	],
	toDOM: (node: Node) =>
		["pre", { ...(node.attrs.id && { id: node.attrs.id }) }, ["code", 0]] as DOMOutputSpec,
} satisfies NodeSpec;

export default {
	codeInline,
	codeBlock,
};
