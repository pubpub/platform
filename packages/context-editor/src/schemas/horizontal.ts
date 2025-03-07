import type { DOMOutputSpec, NodeSpec } from "prosemirror-model";

export default {
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	group: "block",
	parseDOM: [
		{
			tag: "hr",
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
				};
			},
		},
	],
	selectable: true,
	toDOM: () => {
		return ["div", ["hr"]] as DOMOutputSpec;
	},
} satisfies NodeSpec;
