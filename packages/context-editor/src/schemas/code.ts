import type { DOMOutputSpec, MarkSpec } from "prosemirror-model";

export default {
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	parseDOM: [{ tag: "code" }],
	toDOM: (mark) => {
		return [
			"code",
			{
				class: mark.attrs.class,
				...(mark.attrs.id && { id: mark.attrs.id }),
			},
		] as DOMOutputSpec;
	},
} satisfies MarkSpec;
