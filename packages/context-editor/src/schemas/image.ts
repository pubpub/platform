import type { DOMOutputSpec, NodeSpec } from "prosemirror-model";

type Alignment = "left" | "center" | "right" | "block";
export type ImageAttrs = {
	id: string | null;
	class: string | null;
	alt: string;
	src: string;
	linkTo: string;
	credit: string | null; // TODO: should be rich text
	license: string | null; // TODO: should be rich text
	width: number;
	align: Alignment;
};

export default {
	atom: true,
	inline: false,
	group: "block",
	attrs: {
		id: { default: null },
		class: { default: null },
		alt: { default: "" },
		src: { default: "" },
		linkTo: { default: "" },
		credit: { default: null },
		license: { default: null },
		width: { default: 100 },
		align: { default: "center" },
	},
	parseDOM: [
		{
			tag: "img[src]",
			getAttrs: (node) => {
				if (node.getAttribute("data-node-type") !== "image") {
					return false;
				}
				const attrs: ImageAttrs = {
					id: node.getAttribute("id") || null,
					class: node.getAttribute("class") || null,
					alt: node.getAttribute("alt") || "",
					src: node.getAttribute("src") || "",
					linkTo: node.getAttribute("data-link-to") || "",
					credit: node.getAttribute("data-credit") || null,
					license: node.getAttribute("data-license") || null,
					width: Number(node.getAttribute("data-width")) || 100,
					align: (node.getAttribute("data-align") as Alignment) || "center",
				};
				return attrs;
			},
		},
	],
	toDOM: (node) => {
		const attrs = node.attrs as ImageAttrs;
		const { id, class: className, alt, src, credit, linkTo, license, width, align } = attrs;

		return [
			"img",
			{
				...(id && { id }),
				...(className && { class: className }),
				alt,
				src,
				"data-link-to": linkTo,
				"data-credit": credit,
				"data-license": license,
				"data-width": width,
				"data-align": align,
			},
		] as DOMOutputSpec;
	},
} satisfies NodeSpec;
