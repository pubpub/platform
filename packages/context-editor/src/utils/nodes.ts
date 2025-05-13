import type { EditorState } from "prosemirror-state";

import { Mark, Node } from "prosemirror-model";

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

	const figureNode = schema.nodes.figure.create(null, [mediaNode]);
	const insertPos = selection.to;
	const transaction = tr.insert(insertPos, figureNode);
	dispatch(transaction);
};

export const isNode = (node: Node | Mark): node is Node => {
	return "children" in node;
};
