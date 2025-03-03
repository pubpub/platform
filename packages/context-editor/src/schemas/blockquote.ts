import type { DOMOutputSpec, MarkSpec, NodeSpec } from "prosemirror-model";

export default {
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	content: "block+",
	group: "block",
	selectable: false,
	parseDOM: [
		{
			tag: "blockquote",
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
				};
			},
		},
	],
	toDOM: (node) => {
		return [
			"blockquote",
			{
				class: node.attrs.class,
				...(node.attrs.id && { id: node.attrs.id }),
			},
			0,
		] as DOMOutputSpec;
	},
} satisfies NodeSpec;
