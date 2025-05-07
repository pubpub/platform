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

export const insertNodeAtPos = (
	state: EditorState,
	dispatch: Dispatch,
	pos: number,
	childNodeType: string,
	attrs?: Node["attrs"]
) => {
	const { schema, tr } = state;
	const nodeSchema = schema.nodes[childNodeType];
	const node = nodeSchema.create(attrs);
	const transaction = tr.insert(pos, node);
	dispatch(transaction);
};

export const isNode = (node: Node | Mark): node is Node => {
	return "children" in node;
};

// export const insertNodeAsFirstChildOfActiveNode = (
// 	state: EditorState,
// 	dispatch: Dispatch,
// 	nodeType: string,
// 	attrs?: Node["attrs"]
// ) => {
// 	const { schema, tr } = state;
// 	const nodeSchema = schema.nodes[nodeType];
// 	const node = nodeSchema.create(attrs);
// 	const { $from } = state.selection;
// 	const parentPos = $from.before($from.depth);
// 	const transaction = tr.insert(parentPos, node);
// 	dispatch(transaction);
// };

// export const removeNthChildOfActiveNode = (state: EditorState, dispatch: Dispatch, nth: number) => {
// 	const { tr, selection } = state;
// 	const { $from } = selection;
// 	const parentPos = $from.before($from.depth);
// 	const parentNode = $from.node($from.depth);
// 	const childNode = parentNode.child(nth);

// 	if (childNode) {
// 		const transaction = tr.delete(
// 			parentPos + childNode.pos,
// 			parentPos + childNode.pos + childNode.nodeSize
// 		);
// 		dispatch(transaction);
// 	}
// };
