import type { NodeSpec } from "prosemirror-model"

export const figure = {
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	content: "title{0,1} (image|table) figcaption{0,1} credit{0,1} license{0,1}",
	group: "block",
	parseDOM: [
		{
			tag: "figure",
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
			"figure",
			{
				class: node.attrs.class,
				...(node.attrs.id && { id: node.attrs.id }),
			},
			0,
		]
	},
} satisfies NodeSpec

export const figcaption = {
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	content: "inline*",
	group: "figure",
	parseDOM: [
		{
			tag: "figcaption",
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
			"figcaption",
			{
				class: node.attrs.class,
				...(node.attrs.id && { id: node.attrs.id }),
			},
			0,
		]
	},
} satisfies NodeSpec

export const credit = {
	attrs: {
		id: { default: null },
		class: { default: null },
		"data-credit": { default: true },
	},
	content: "inline*",
	group: "figure",
	parseDOM: [
		{
			tag: "figure p[data-credit]",
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
			"p",
			{
				class: node.attrs.class,
				...(node.attrs.id && { id: node.attrs.id }),
			},
			0,
		]
	},
} satisfies NodeSpec

export const license = {
	attrs: {
		id: { default: null },
		class: { default: null },
		"data-license": { default: true },
	},
	content: "inline*",
	group: "figure",
	parseDOM: [
		{
			tag: "figure p[data-license]",
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
			"p",
			{
				class: node.attrs.class,
				...(node.attrs.id && { id: node.attrs.id }),
			},
			0,
		]
	},
} satisfies NodeSpec

export const title = {
	content: "text*",
	group: "figure",
	attrs: {
		id: { default: null },
		class: { default: null },
	},
	toDOM: (node) => {
		return [
			"div",
			{
				class: ["title", node.attrs.class].filter(Boolean).join(" "),
				...(node.attrs.id && { id: node.attrs.id }),
			},
			0,
		]
	},
} satisfies NodeSpec
