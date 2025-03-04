import { EditorState, NodeSelection } from "prosemirror-state";

import type { Dispatch } from "./types";
import { insertNodeIntoEditor } from "../utils/nodes";
import { createCommandSpec } from "./util";

const runInsertImage = (state: EditorState, dispatch?: Dispatch) => {
	const { node } = state.selection as NodeSelection;

	if (dispatch) {
		// Insert a new image block
		insertNodeIntoEditor(state, dispatch, "image", { src: "https://placecats.com/300/200" });
	}

	return true;
};

export const isImageActive = (state: EditorState) => {
	const { node } = state.selection as NodeSelection;
	return node && node.type.name === "image";
};

export const insertImage = createCommandSpec((dispatch, state) => ({
	run: () => runInsertImage(state, dispatch),
	canRun: runInsertImage(state),
	isActive: isImageActive(state),
}));
