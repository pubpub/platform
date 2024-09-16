import { DOMOutputSpec, NodeSpec } from "prosemirror-model";

export default {
	attrs: {
		level: { default: 1 },
		fixedId: { default: "" },
		id: { default: "" },
		class: { default: null },
	},
	content: "inline*",
	group: "block",
	defining: true,
	selectable: false,
	parseDOM: [1, 2, 3, 4, 5, 6].map((level) => {
		return {
			tag: `h${level}`,
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
					level,
				};
			},
		};
	}),
	toDOM: (node) => {
		return [
			`h${node.attrs.level}`,
			{
				class: node.attrs.class,
				id: node.attrs.fixedId || node.attrs.id,
			},
			0,
		] as DOMOutputSpec;
	},
} satisfies NodeSpec;
