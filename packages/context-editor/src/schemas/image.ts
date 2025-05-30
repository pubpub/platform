import type { DOMOutputSpec, NodeSpec } from "prosemirror-model";

export enum Alignment {
	left = "left",
	center = "center",
	right = "right",
	verticalCenter = "verticalCenter",
	expand = "expand",
}

export type ImageAttrs = {
	id: string | null;
	class: string | null;
	alt: string;
	src: string;
	linkTo: string;
	width: number;
	align: Alignment;
	fullResolution: boolean;
};

export default {
	atom: true,
	inline: false,
	group: "figure",
	attrs: {
		id: { default: null },
		class: { default: null },
		alt: { default: "" },
		src: { default: "" },
		linkTo: { default: "" },
		width: { default: 100 },
		align: { default: "center" },
		fullResolution: { default: false },
	},
	parseDOM: [
		{
			tag: "img[src]",
			getAttrs: (node) => {
				const attrs: ImageAttrs = {
					id: node.getAttribute("id") || null,
					class: node.getAttribute("class") || null,
					alt: node.getAttribute("alt") || "",
					src: node.getAttribute("src") || "",
					linkTo: node.getAttribute("data-link-to") || "",
					width: Number(node.getAttribute("data-width")) || 100,
					align: (node.getAttribute("data-align") as Alignment) || "center",
					fullResolution: node.getAttribute("data-full-resolution") === "true",
				};
				return attrs;
			},
		},
	],
	toDOM: (node) => {
		const attrs = node.attrs as ImageAttrs;
		const { id, class: className, alt, src, linkTo, width, align } = attrs;

		return [
			"img",
			{
				...(id && { id }),
				...(className && { class: className }),
				alt,
				src,
				"data-link-to": linkTo,
				"data-width": width,
				"data-align": align,
				"data-node-type": "image",
			},
		] as DOMOutputSpec;
	},
} satisfies NodeSpec;
