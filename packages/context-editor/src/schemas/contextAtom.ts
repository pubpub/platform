import type { DOMOutputSpec, NodeSpec } from "prosemirror-model";

export default {
	atom: true,
	group: "block",
	attrs: {
		id: { default: null },
		class: { default: null },
		pubId: { default: null },
		pubTypeId: {default: null},
		parentPubId: {default: null},
		fieldSlug: {default: null},
		data: { default: null },
	},
	parseDOM: [
		{
			tag: "section",
			getAttrs: (node) => {
				if (!(node as Element).getAttribute("data-atom")) {
					return false;
				}
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
					pubId: (node as Element).getAttribute("data-pub-id"),
				};
			},
		},
	],
	toDOM: (node) => {
		return [
			"section",
			{
				"data-atom": true,
				class: node.attrs.class,
				...(node.attrs.id && { id: node.attrs.id }),
				"data-pub-id": node.attrs.pubId.toString(),
			},
		] as DOMOutputSpec;
	},
} satisfies NodeSpec;
