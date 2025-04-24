import type { DOMOutputSpec, NodeSpec } from "prosemirror-model";

export const figure = {
	content: "image* figcaption{0,1}",
	group: "block",
	parseDOM: [
		{
			tag: "figure",
		},
	],
	toDOM: (node) => {
		return ["figure", 0];
	},
} satisfies NodeSpec;

export const figcaption = {
	content: "inline*",
	group: "figure",
	parseDom: [{ tag: "figcaption" }],
	toDOM: (node) => {
		return ["figcaption", 0];
	},
} satisfies NodeSpec;
