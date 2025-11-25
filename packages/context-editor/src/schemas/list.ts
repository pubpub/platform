import type { DOMOutputSpec, NodeSpec } from "prosemirror-model"

const orderedList = {
	content: "list_item+",
	group: "block",
	attrs: {
		id: { default: null },
		class: { default: null },
		// The number the list starts at
		order: { default: 1, validate: "number" },
	},
	selectable: false,
	parseDOM: [
		{
			tag: "ol",
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
					order: (node as Element).hasAttribute("start")
						? +(node as Element).getAttribute("start")!
						: 1,
				}
			},
		},
	],
	toDOM: (node) => {
		return [
			"ol",
			{
				class: node.attrs.class,
				...(node.attrs.id && { id: node.attrs.id }),
				start: node.attrs.order === 1 ? null : node.attrs.order,
			},
			0,
		] as DOMOutputSpec
	},
} satisfies NodeSpec

const bulletList = {
	content: "list_item+",
	group: "block",
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	selectable: false,
	parseDOM: [
		{
			tag: "ul",
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
				}
			},
		},
	],
	toDOM: (node) => {
		return [
			"ul",
			{
				class: node.attrs.class,
				...(node.attrs.id && { id: node.attrs.id }),
			},
			0,
		] as DOMOutputSpec
	},
} satisfies NodeSpec

const listItem = {
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	content: "paragraph block*",
	defining: true,
	selectable: false,
	parseDOM: [
		{
			tag: "li",
			getAttrs: (node) => {
				return {
					id: (node as Element).getAttribute("id"),
					class: (node as Element).getAttribute("class"),
				}
			},
		},
	],
	toDOM: () => {
		return ["li", 0] as DOMOutputSpec
	},
} satisfies NodeSpec

export default { bulletList, orderedList, listItem }
