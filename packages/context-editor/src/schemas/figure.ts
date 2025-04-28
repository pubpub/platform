import type { DOMOutputSpec, NodeSpec } from "prosemirror-model";

export const figure = {
	content: "image figcaption{0,1} credit{0,1} license{0,1}",
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

export const credit = {
	attrs: {
		credit: { default: true },
	},
	content: "inline*",
	group: "figure",
	parseDOM: [
		{
			tag: "p",
			// getAttrs: (node) => {
			// 	return {
			// 		credit: (node as Element).getAttribute("credit"),
			// 	};
			// },
		},
	],
	toDOM: (node) => {
		return ["p", 0];
	},
} satisfies NodeSpec;

export const license = {
	attrs: {},
	content: "inline*",
	group: "figure",
	parseDOM: [
		{
			tag: "p",
		},
	],
	toDOM: (node) => {
		return ["p", 0];
	},
} satisfies NodeSpec;
