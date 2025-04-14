import type { DOMOutputSpec, MarkSpec } from "prosemirror-model";

const getAttrs = (node: HTMLElement) => {
	return {
		id: (node as Element).getAttribute("id"),
		class: (node as Element).getAttribute("class"),
	};
};

export default {
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	parseDOM: [
		{ tag: "s", getAttrs },
		{ tag: "strike", getAttrs },
		{ tag: "del", getAttrs },
	],
	toDOM: (mark) => {
		return [
			"s",
			{
				class: mark.attrs.class,
				...(mark.attrs.id && { id: mark.attrs.id }),
			},
		] as DOMOutputSpec;
	},
} satisfies MarkSpec;
