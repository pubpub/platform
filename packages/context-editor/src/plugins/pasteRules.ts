import type { Node, Schema } from "prosemirror-model";

import { Fragment, Slice } from "prosemirror-model";
import { Plugin } from "prosemirror-state";

import { emailOrUriRegexBase, markdownLinkRegex } from "../utils/links";

type PasteRule = {
	regex: RegExp;
	transform: (match: RegExpExecArray, node: Node, start: number, end: number) => Node;
};

export default (schema: Schema) => {
	const rules = [
		{
			regex: markdownLinkRegex,
			transform: (match, node, start, end) => {
				if (
					!match.groups ||
					!("emailOrUri" in match.groups) ||
					!("atSign" in match.groups) ||
					!("linkText" in match.groups)
				) {
					return node;
				}
				const { emailOrUri, atSign, linkText } = match.groups;
				const attributes = atSign ? { href: "mailto:" + emailOrUri } : { href: emailOrUri };
				return schema.text(
					linkText,
					schema.marks.link.create(attributes).addToSet(node.marks)
				);
			},
		},
		{
			regex: new RegExp(emailOrUriRegexBase, "g"),
			transform: (match, node, start, end) => {
				if (
					!match.groups ||
					!("emailOrUri" in match.groups) ||
					!("atSign" in match.groups)
				) {
					return node;
				}

				const { emailOrUri, atSign } = match.groups;
				const attributes = atSign ? { href: "mailto:" + emailOrUri } : { href: emailOrUri };
				return node
					.cut(start, end)
					.mark(schema.marks.link.create(attributes).addToSet(node.marks));
			},
		},
	] satisfies PasteRule[];

	const applyTransform = (node: Node, rule: PasteRule): Node[] => {
		let transformedNodes: Node[] = [];
		if (!node.isText) {
			transformedNodes.push(
				...node.content.content.flatMap((child) => applyTransform(child, rule))
			);
		} else {
			if (!node.text) {
				return [node];
			}
			let match;
			let pos = 0;
			while ((match = rule.regex.exec(node.text))) {
				const start = match.index;
				const end = start + match[0].length;
				if (start > 0) {
					transformedNodes.push(node.cut(pos, start));
				}
				const transformed = rule.transform(match, node, start, end);

				if (transformed) {
					transformedNodes.push(transformed);
				}
				pos = end;
			}
			if (pos < node.text.length) {
				transformedNodes.push(node.cut(pos));
			}
		}
		return transformedNodes;
	};

	return new Plugin({
		props: {
			handlePaste: (view, event, slice) => {},
			transformPasted: (slice, view) => {
				let transformedNodes: Node[] = [...slice.content.content];
				for (const rule of rules) {
					transformedNodes = transformedNodes.flatMap((node) =>
						applyTransform(node, rule)
					);
				}
				return new Slice(
					Fragment.fromArray(transformedNodes),
					slice.openStart,
					slice.openEnd
				);
			},
		},
	});
};
