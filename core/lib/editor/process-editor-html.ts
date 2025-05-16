import rehypeFormat from "rehype-format";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

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
