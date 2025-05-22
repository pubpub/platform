import type { Node } from "prosemirror-model";

import { EditorState } from "prosemirror-state";

export const docHasChanged = (initialDoc: Node, currentEditorState: EditorState) => {
	const hasChanged = currentEditorState.doc.content.findDiffStart(initialDoc.content) !== null;
	return hasChanged;
};
