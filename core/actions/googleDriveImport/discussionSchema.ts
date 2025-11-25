import type { DOMOutputSpec, Mark, Node, NodeSpec } from "prosemirror-model"

import { Schema } from "prosemirror-model"

export const baseNodes: { [key: string]: NodeSpec } = {
	doc: {
		content: "block+",
		attrs: {
			meta: { default: {} },
		},
	},
	paragraph: {
		selectable: false,
		// reactive: true,
		content: "inline*",
		group: "block",
		attrs: {
			id: { default: null },
			class: { default: null },
			textAlign: { default: null },
			rtl: { default: null },
		},
		parseDOM: [
			{
				tag: "p",
				getAttrs: (node) => {
					return {
						id: (node as Element).getAttribute("id"),
						class: (node as Element).getAttribute("class"),
						textAlign: (node as Element).getAttribute("data-text-align"),
						rtl: (node as Element).getAttribute("data-rtl"),
					}
				},
			},
		],
		toDOM: (node) => {
			const isEmpty = !node.content || (Array.isArray(node.content) && !node.content.length)
			const children = isEmpty ? ["br"] : 0
			return [
				"p",
				{
					class: node.attrs.class,
					...(node.attrs.id && { id: node.attrs.id }),
					...(node.attrs.textAlign && { "data-text-align": node.attrs.textAlign }),
					...(node.attrs.rtl && { "data-rtl": node.attrs.rtl.toString() }),
				},
				children,
			] as DOMOutputSpec
		},
	},
	blockquote: {
		content: "block+",
		group: "block",
		attrs: {
			id: { default: null },
		},
		selectable: false,
		parseDOM: [
			{
				tag: "blockquote",
				getAttrs: (node) => {
					return {
						id: (node as Element).getAttribute("id"),
					}
				},
			},
		],
		toDOM: (node) => {
			return [
				"blockquote",
				{ ...(node.attrs.id && { id: node.attrs.id }) },
				0,
			] as DOMOutputSpec
		},
	},
	horizontal_rule: {
		group: "block",
		parseDOM: [{ tag: "hr" }],
		selectable: true,
		toDOM: () => {
			return ["div", ["hr"]] as DOMOutputSpec
		},
	},
	heading: {
		attrs: {
			level: { default: 1 },
			fixedId: { default: "" },
			id: { default: "" },
			textAlign: { default: null },
			rtl: { default: null },
		},
		content: "inline*",
		group: "block",
		defining: true,
		selectable: false,
		parseDOM: [1, 2, 3, 4, 5, 6].map((level) => {
			return {
				tag: `h${level}`,
				getAttrs: (node) => {
					return {
						id: (node as Element).getAttribute("id"),
						textAlign: (node as Element).getAttribute("data-text-align"),
						rtl: (node as Element).getAttribute("data-rtl"),
						level,
					}
				},
			}
		}),
		toDOM: (node) => {
			return [
				`h${node.attrs.level}`,
				{
					id: node.attrs.fixedId || node.attrs.id,
					...(node.attrs.textAlign && { "data-text-align": node.attrs.textAlign }),
					...(node.attrs.rtl && { "data-rtl": node.attrs.rtl.toString() }),
				},
				0,
			] as DOMOutputSpec
		},
	},
	ordered_list: {
		content: "list_item+",
		group: "block",
		attrs: {
			id: { default: null },
			order: { default: 1 },
			rtl: { default: null },
		},
		selectable: false,
		parseDOM: [
			{
				tag: "ol",
				getAttrs: (node) => {
					return {
						id: (node as Element).getAttribute("id"),
						order: (node as Element).hasAttribute("start")
							? +(node as Element).getAttribute("start")!
							: 1,
						rtl: (node as Element).getAttribute("data-rtl"),
					}
				},
			},
		],
		toDOM: (node) => {
			return [
				"ol",
				{
					...(node.attrs.id && { id: node.attrs.id }),
					...(node.attrs.textAlign && { "data-text-align": node.attrs.textAlign }),
					...(node.attrs.rtl && { "data-rtl": node.attrs.rtl.toString() }),
					start: node.attrs.order === 1 ? null : node.attrs.order,
				},
				0,
			] as DOMOutputSpec
		},
	},
	bullet_list: {
		content: "list_item+",
		group: "block",
		attrs: {
			id: { default: null },
			rtl: { default: null },
		},
		selectable: false,
		parseDOM: [
			{
				tag: "ul",
				getAttrs: (node) => {
					return {
						id: (node as Element).getAttribute("id"),
						rtl: (node as Element).getAttribute("data-rtl"),
					}
				},
			},
		],
		toDOM: (node) => {
			return [
				"ul",
				{
					...(node.attrs.id && { id: node.attrs.id }),
					...(node.attrs.textAlign && { "data-text-align": node.attrs.textAlign }),
					...(node.attrs.rtl && { "data-rtl": node.attrs.rtl.toString() }),
				},
				0,
			] as DOMOutputSpec
		},
	},
	list_item: {
		content: "paragraph block*",
		defining: true,
		selectable: false,
		parseDOM: [{ tag: "li" }],
		toDOM: () => {
			return ["li", 0] as DOMOutputSpec
		},
	},
	text: {
		inline: true,
		group: "inline",
		toDOM: (node) => {
			return node.text!
		},
	},
	hard_break: {
		inline: true,
		group: "inline",
		selectable: false,
		parseDOM: [{ tag: "br" }],
		toDOM: () => {
			return ["br"] as DOMOutputSpec
		},
	},
	image: {
		atom: true,
		reactive: true,
		attrs: {
			id: { default: null },
			url: { default: null },
			src: { default: null },
			size: { default: 50 }, // number as percentage
			align: { default: "center" },
			caption: { default: "" },
			altText: { default: "" },
			hideLabel: { default: false },
			fullResolution: { default: false },
			href: { default: null },
		},
		parseDOM: [
			{
				tag: "figure",
				getAttrs: (node) => {
					if (node.getAttribute("data-node-type") !== "image") {
						return false
					}
					return {
						id: node.getAttribute("id") || null,
						url: node.getAttribute("data-url") || null,
						caption: node.getAttribute("data-caption") || "",
						size: Number(node.getAttribute("data-size")) || 50,
						align: node.getAttribute("data-align") || "center",
						altText: node.getAttribute("data-alt-text") || "",
						hideLabel: node.getAttribute("data-hide-label") || "",
						href: node.getAttribute("data-href") || null,
					}
				},
			},
		],
		toDOM: (node) => {
			const { url, align, id, altText, caption, size, hideLabel, href } = node.attrs
			return [
				"figure",
				{
					...(id && { id }),
					"data-node-type": "image",
					"data-size": size,
					"data-align": align,
					"data-url": url,
					"data-caption": caption,
					"data-href": href,
					"data-alt-text": altText,
					"data-hide-label": hideLabel,
				},
				[
					"img",
					{
						src: url,
						alt: altText || "",
					},
				],
			] as unknown as DOMOutputSpec
		},
		inline: false,
		group: "block",
	},
	file: {
		atom: true,
		attrs: {
			id: { default: null },
			url: { default: null },
			fileName: { default: null },
			fileSize: { default: null },
			caption: { default: "" },
		},
		parseDOM: [
			{
				tag: "figure",
				getAttrs: (node) => {
					if (node.getAttribute("data-node-type") !== "file") {
						return false
					}
					return {
						id: node.getAttribute("id") || null,
						url: node.getAttribute("data-url") || null,
						fileName: node.getAttribute("data-file-name") || null,
						fileSize: node.getAttribute("data-file-size") || null,
						caption: node.getAttribute("data-caption") || "",
					}
				},
			},
		],
		toDOM: (node: Node) => {
			const attrs = node.attrs
			return [
				"p",
				[
					"a",
					{
						href: attrs.url,
						target: "_blank",
						rel: "noopener noreferrer",
						download: attrs.fileName,
						class: `download`,
					},
					attrs.fileName,
				],
			]
		},
		inline: false,
		group: "block",
	},
	code_block: {
		content: "text*",
		group: "block",
		attrs: {
			lang: { default: null },
			id: { default: null },
		},
		code: true,
		selectable: false,
		parseDOM: [
			{
				tag: "pre",
				getAttrs: (node) => {
					return {
						id: (node as Element).getAttribute("id"),
					}
				},
				preserveWhitespace: "full" as const,
			},
		],
		toDOM: (node: Node) =>
			["pre", { ...(node.attrs.id && { id: node.attrs.id }) }, ["code", 0]] as DOMOutputSpec,
	},
}

export const baseMarks = {
	em: {
		parseDOM: [
			{ tag: "i" },
			{ tag: "em" },
			{
				style: "font-style",
				getAttrs: (value: string) => value === "italic" && null,
			},
		],
		toDOM: () => {
			return ["em"] as DOMOutputSpec
		},
	},

	strong: {
		parseDOM: [
			{ tag: "strong" },
			/*
			This works around a Google Docs misbehavior where
			pasted content will be inexplicably wrapped in `<b>`
			tags with a font-weight normal.
			*/
			{
				tag: "b",
				getAttrs: (node: HTMLElement) => node.style.fontWeight !== "normal" && null,
			},
			{
				style: "font-weight",
				getAttrs: (value: string) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
			},
		],
		toDOM: () => {
			return ["strong"] as DOMOutputSpec
		},
	},
	link: {
		inclusive: false,
		attrs: {
			href: { default: "" },
			title: { default: null },
			target: { default: null },
			pubEdgeId: { default: null },
		},
		parseDOM: [
			{
				tag: "a[href]",
				getAttrs: (dom: HTMLElement) => {
					if (dom.getAttribute("data-node-type") === "reference") {
						return false
					}
					return {
						href: dom.getAttribute("href"),
						title: dom.getAttribute("title"),
						target: dom.getAttribute("target"),
						pubEdgeId: dom.getAttribute("data-pub-edge-id"),
					}
				},
			},
		],
		toDOM: (mark: Mark, _inline: boolean) => {
			let attrs = mark.attrs
			if (attrs.target && typeof attrs.target !== "string") {
				attrs = { ...attrs, target: null }
			}
			const { pubEdgeId, ...restAttrs } = attrs
			return ["a", { "data-pub-edge-id": pubEdgeId, ...restAttrs }] as DOMOutputSpec
		},
	},
	sub: {
		parseDOM: [{ tag: "sub" }],
		toDOM: () => {
			return ["sub"] as DOMOutputSpec
		},
	},
	sup: {
		parseDOM: [{ tag: "sup" }],
		toDOM: () => {
			return ["sup"] as DOMOutputSpec
		},
	},
	strike: {
		parseDOM: [{ tag: "s" }, { tag: "strike" }, { tag: "del" }],
		toDOM: () => {
			return ["s"] as DOMOutputSpec
		},
	},
	code: {
		parseDOM: [{ tag: "code" }],
		toDOM: () => {
			return ["code"] as DOMOutputSpec
		},
	},
}

const mySchema = new Schema({
	nodes: baseNodes,
	marks: baseMarks,
})

export default mySchema
