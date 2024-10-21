import { DOMOutputSpec, MarkSpec } from "prosemirror-model";

export default {
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	parseDOM: [
		{
			tag: "strong",
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
				};
			},
		},
		/*
		This works around a Google Docs misbehavior where
		pasted content will be inexplicably wrapped in `<b>`
		tags with a font-weight normal.
		*/
		{ tag: "b", getAttrs: (node) => node.style.fontWeight !== "normal" && null },
		{
			style: "font-weight",
			getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
		},
	],
	toDOM: (mark) => {
		return [
			"strong",
			{
				class: mark.attrs.class,
				...(mark.attrs.id && { id: mark.attrs.id }),
			},
		] as DOMOutputSpec;
	},
} satisfies MarkSpec;
