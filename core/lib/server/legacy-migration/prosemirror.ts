import { baseSchema } from "context-editor/schemas";

const unsupportedNodes = {
	citation: "inline",
	footnote: "inline",
	iframe: "block",
} as const;

type OldImageNode = {
	type: "image";
	attrs: {
		id: string;
		url: string;
		href: null | string;
		size: number;
		align: string;
		altText: string;
		caption: string;
		hideLabel: boolean;
		fullResolution: boolean;
	};
};

type Alignment = "left" | "center" | "right" | "block";

type NewImageNode = {
	type: "image";
	attrs: {
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
};

const nodeReplacements = {
	image: (node: OldImageNode): NewImageNode => {
		const newNode = {
			type: "image",
			attrs: {
				id: node.attrs.id,
				class: null,
				alt: node.attrs.altText,
				src: node.attrs.url,
				linkTo: node.attrs.href ?? "",
				credit: null,
				license: null,
				width: node.attrs.size,
				align: node.attrs.align as Alignment,
			},
		} as const;

		return newNode;
	},
} as const;

export const transformProsemirrorTree = (doc: any) => {
	// helper to check if node is supported
	const isNodeSupported = (node: any) => {
		return node && node.type && baseSchema.nodes[node.type];
	};

	// create replacement nodes based on whether original was inline or block
	const createReplacementNode = (node: any) => {
		// infer if node was inline based on its structure and parent
		const isInline =
			(node.type in unsupportedNodes &&
				unsupportedNodes[node.type as keyof typeof unsupportedNodes] === "inline") ||
			(node.marks && node.marks.length > 0);

		const base = {
			type: isInline ? "text" : "paragraph",
		} as {
			type: "text" | "paragraph";
			text?: string;
			content?: {
				type: "text";
				text: string;
			}[];
		};

		if (isInline) {
			base.text = `!unsupported node '${node.type}'!`;
		} else {
			base.content = [
				{
					type: "text",
					text: `!unsupported node '${node.type}'!`,
				},
			];
		}

		return base;
	};

	let nextParagraphIsAbstract = false;
	let abstract: Node | undefined;

	// mutably walk and transform the tree
	// TODO: fix these anys
	const visitNode = (node: any, depth: number[] = [0]) => {
		if (!node) {
			return null;
		}

		if (
			node.type === "heading" &&
			depth[1] === 0 &&
			node.attrs?.level === 1 &&
			node.content?.[0]?.text === "Abstract" &&
			node.content?.length === 1
		) {
			nextParagraphIsAbstract = true;
			return null; // delete the heading
		}

		// handle content array
		if (node.content && Array.isArray(node.content)) {
			// filter out null values and transform remaining nodes
			node.content = node.content
				.map((child: any, i: number) => {
					return visitNode(child, [...depth, i]);
				})
				.filter(Boolean); // remove null values

			// if content array is empty after filtering, delete the node itself
			if (node.content.length === 0) {
				return null;
			}
		}

		if (!isNodeSupported(node)) {
			return createReplacementNode(node);
		}

		if (node.type in nodeReplacements) {
			return nodeReplacements[node.type as keyof typeof nodeReplacements](node);
		}

		// handle marks array if present
		if (node.marks && Array.isArray(node.marks)) {
			node.marks = node.marks.filter((mark: any) => baseSchema.marks[mark.type]);
		}

		if (nextParagraphIsAbstract && node.type === "paragraph") {
			nextParagraphIsAbstract = false;
			if (node.type === "paragraph") {
				abstract = structuredClone(node);
				return null; // delete the paragraph after saving it
			}
		}

		return node;
	};

	// start walking from root
	const result = visitNode(doc);

	return {
		doc: result,
		interestingNodes: {
			abstract,
		},
	};
};
