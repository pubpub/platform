import type { NodeSpec } from "prosemirror-model";

export default {
	content: "title? (table | image) caption?",
	group: "block",
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	parseDOM: [
		{
			tag: "figure",
			getAttrs: (node) => {
				return {
					id: node.getAttribute("id"),
					class: node.getAttribute("class"),
				};
			},
		},
	],
	toDOM: (node) => {
		return [
			"figure",
			{
				class: node.attrs.class,
				...(node.attrs.id && { id: node.attrs.id }),
			},
			0,
		];
	},
} satisfies NodeSpec;
