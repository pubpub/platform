import type { DOMOutputSpec, MarkSpec } from "prosemirror-model";

export default {
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	parseDOM: [
		{ tag: "i" },
		{
			tag: "em",
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
				};
			},
		},
		{
			style: "font-style",
			getAttrs: (value) => value === "italic" && null,
		},
	],
	toDOM: (mark) => {
		return [
			"em",
			{
				class: mark.attrs.class,
				...(mark.attrs.id && { id: mark.attrs.id }),
			},
		] as DOMOutputSpec;
	},
} satisfies MarkSpec;
