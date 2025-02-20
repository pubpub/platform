import type { MarkType } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";

export const markIsActive = (markType: MarkType, editorState: EditorState) => {
	const { from, $from, to, empty } = editorState.selection;
	if (empty) {
		return !!markType.isInSet(editorState.storedMarks || $from.marks());
	}
	return editorState.doc.rangeHasMark(from, to, markType);
};
