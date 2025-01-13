import { EditorState } from "prosemirror-state";

import { baseSchema } from "../schemas";

export const docHasChanged = (initialDoc: object, currentEditorState: EditorState) => {
	const initialDocNode = baseSchema.nodeFromJSON(initialDoc);
	const hasChanged =
		currentEditorState.doc.content.findDiffStart(initialDocNode.content) !== null;
	return hasChanged;
};
