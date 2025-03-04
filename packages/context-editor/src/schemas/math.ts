import type { DOMOutputSpec, MarkSpec, NodeSpec } from "prosemirror-model";

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
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
				};
			},
		},
	],
	toDOM: () => ["math-inline", { class: "math-node" }, 0],
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
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
				};
			},
		},
	],
	toDOM: () => ["math-display", { class: "math-node" }, 0],
} satisfies NodeSpec;

export default {
	math_inline: mathInline,
	math_display: mathDisplay,
};
