import type { DOMOutputSpec, NodeSpec } from "prosemirror-model"

export default {
	selectable: false,
	content: "inline*",
	group: "block",
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	parseDOM: [
		{
			tag: "p",
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
				}
			},
		},
	],
	toDOM: (node) => {
		return [
			"p",
			{
				class: node.attrs.class,
				...(node.attrs.id && { id: node.attrs.id }),
			},
			0,
		] as DOMOutputSpec
	},
} satisfies NodeSpec
