import type { EditorState } from "prosemirror-state";

import { Node } from "prosemirror-model";

import type { Dispatch } from "../commands/types";

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
