import { baseSchema } from "context-editor/schemas";
import { JSDOM } from "jsdom";
import { DOMParser, DOMSerializer, Node } from "prosemirror-model";
import rehypeFormat from "rehype-format";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

export const renderNodeToHTML = (node: Node): string => {
	const dom = new JSDOM();
	const document = dom.window.document;

	// necessary for rendering math, see `context-editor/schemas/math.ts`
	global.document = document;
	const fragment = DOMSerializer.fromSchema(baseSchema).serializeFragment(node.content, {
		document,
	});

	const container = document.createElement("div");
	container.appendChild(fragment);

	// @ts-expect-error "Operand of delete must be optional" shut up man
	delete global.document;

	return container.innerHTML;
};

export const fromHTMLToNode = (html: string) => {
	const dom = new JSDOM(html);

	const node = DOMParser.fromSchema(baseSchema).parse(dom.window.document);

	return node;
};

export const processEditorHTML = (
	html: string,
	opts?: {
		plugins?: any[];
		settings?: {
			fragment?: boolean;
			pretty?: boolean;
		};
	}
) => {
	const processor = unified().use(rehypeParse, opts?.settings);

	if (opts?.settings?.pretty) {
		processor.use(rehypeFormat);
	}
	if (opts?.plugins) {
		opts.plugins.forEach((plugin) => {
			processor.use(plugin);
		});
	}

	return {
		html: async () => {
			const file = await processor.use(rehypeStringify).process(html);
			return String(file);
		},
		processor,
	};
};
