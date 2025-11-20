import type { DOMOutputSpec, MarkSpec } from "prosemirror-model"

const sub = {
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	parseDOM: [
		{
			tag: "sub",
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
				}
			},
		},
	],
	toDOM: (mark) => {
		return [
			"sub",
			{
				class: mark.attrs.class,
				...(mark.attrs.id && { id: mark.attrs.id }),
			},
		] as DOMOutputSpec
	},
} satisfies MarkSpec

const sup = {
	parseDOM: [
		{
			tag: "sup",
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
				}
			},
		},
	],
	toDOM: (mark) => {
		return [
			"sup",
			{
				class: mark.attrs.class,
				...(mark.attrs.id && { id: mark.attrs.id }),
			},
		] as DOMOutputSpec
	},
} satisfies MarkSpec

export default { sub, sup }
