import type { DOMOutputSpec, MarkSpec } from "prosemirror-model";

export default {
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	parseDOM: [
		{
			tag: "u",
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
				};
			},
		},
		{
			style: "text-decoration",
			getAttrs: (value) => value === "underline" && null,
		},
	],
	toDOM: (mark) => {
		return [
			"u",
			{
				class: mark.attrs.class,
				...(mark.attrs.id && { id: mark.attrs.id }),
			},
		] as DOMOutputSpec;
	},
} satisfies MarkSpec;
