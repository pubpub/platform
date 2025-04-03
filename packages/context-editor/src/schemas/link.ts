import type { DOMOutputSpec, MarkSpec } from "prosemirror-model";

export default {
	inclusive: false,
	attrs: {
		href: { default: "" },
		title: { default: null },
		target: { default: null },
	},
	parseDOM: [
		{
			tag: "a[href]",
			getAttrs: (dom) => {
				return {
					href: dom.getAttribute("href"),
					title: dom.getAttribute("title"),
					target: dom.getAttribute("target"),
				};
			},
		},
	],
	toDOM: (node) => {
		return ["a", { ...node.attrs }] as DOMOutputSpec;
	},
} satisfies MarkSpec;
