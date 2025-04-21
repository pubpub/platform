import type { DOMOutputSpec, MarkSpec } from "prosemirror-model";

export default {
	inclusive: false,
	attrs: {
		id: { default: null },
		class: { default: null },
		href: { default: "" },
		title: { default: null },
		target: { default: null },
	},
	parseDOM: [
		{
			tag: "a[href]",
			getAttrs: (dom) => {
				return {
					id: dom.getAttribute("id"),
					class: dom.getAttribute("class"),
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
