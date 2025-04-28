import type { EditorState } from "prosemirror-state";

import { Node } from "prosemirror-model";

import type { Dispatch } from "../commands/types";
import type { ImageAttrs } from "../schemas/image";

export const replaceSelectionWithNode = (
	state: EditorState,
	dispatch: Dispatch,
	nodeType: string,
	attrs?: Node["attrs"]
) => {
	const { schema, tr } = state;
	const nodeSchema = schema.nodes[nodeType];

	const node = nodeSchema.create(attrs);
	const transaction = tr.replaceSelectionWith(node);
	dispatch(transaction);
};

export const insertNodeAfterSelection = (
	state: EditorState,
	dispatch: Dispatch,
	nodeType: string,
	attrs?: Node["attrs"]
) => {
	const { schema, tr, selection } = state;
	const nodeSchema = schema.nodes[nodeType];

	const node = nodeSchema.create(attrs);
	const insertPos = selection.to;
	const transaction = tr.insert(insertPos, node);
	dispatch(transaction);
};

export const insertMedia = (state: EditorState, dispatch: Dispatch, attrs: ImageAttrs) => {
	const { schema, tr, selection } = state;
	const mediaNode = schema.nodes.image.create(attrs);

	const nodes = [mediaNode];
	if (attrs.caption) {
		const captionNode = schema.nodes.figcaption.create(null);
		nodes.push(captionNode);
	}
	if (attrs.credit) {
		nodes.push(schema.nodes.credit.create(null));
	}
	if (attrs.license) {
		nodes.push(schema.nodes.license.create(null));
	}
	const figureNode = schema.nodes.figure.create(null, nodes);
	const insertPos = selection.to;
	const transaction = tr.insert(insertPos, figureNode);
	dispatch(transaction);
};
