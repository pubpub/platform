import type { EditorView } from "prosemirror-view";

import { Node } from "prosemirror-model";

export const insertNodeIntoEditor = (view: EditorView, nodeType: string, attrs?: Node["attrs"]) => {
	const { schema, tr } = view.state;
	const nodeSchema = schema.nodes[nodeType];
	if (nodeSchema.spec.onInsert) {
		nodeSchema.spec.onInsert(view, attrs);
	} else {
		const node = nodeSchema.create(attrs);
		const transaction = tr.replaceSelectionWith(node);
		view.dispatch(transaction);
	}
};
