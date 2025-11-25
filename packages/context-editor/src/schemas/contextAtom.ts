import type { DOMOutputSpec, NodeSpec } from "prosemirror-model"

export default {
	atom: true,
	group: "block",
	attrs: {
		id: { default: null },
		class: { default: null },
		pubId: { default: null },
		pubTypeId: { default: null },
		parentPubId: { default: null },
		fieldSlug: { default: null },
		data: { default: null },
	},
	parseDOM: [
		{
			tag: "section",
			getAttrs: (node) => {
				if (!node.getAttribute("data-atom")) {
					return false
				}

				const data = node.querySelector("script[x-data]") as HTMLScriptElement

				return {
					id: node.getAttribute("id"),
					class: node.getAttribute("class"),
					pubId: node.getAttribute("data-pub-id"),
					parentPubId: node.getAttribute("data-parent-pub-id"),
					fieldSlug: node.getAttribute("data-field-slug"),
					pubTypeId: node.getAttribute("data-pub-type-id"),
					data: data ? JSON.parse(data.textContent || "{}") : null,
				}
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
				"data-parent-pub-id": node.attrs.parentPubId.toString(),
				"data-field-slug": node.attrs.fieldSlug.toString(),
				"data-pub-type-id": node.attrs.pubTypeId.toString(),
			},
			[
				"script",
				{
					"x-data": true,
					type: "application/json",
				},
				JSON.stringify(node.attrs.data),
			],
		] as DOMOutputSpec
	},
} satisfies NodeSpec
