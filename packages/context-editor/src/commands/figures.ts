import type { EditorState, NodeSelection } from "prosemirror-state";

import type { Dispatch } from "./types";
import { insertNodeAtPos } from "../utils/nodes";

export const enableTitle = (state: EditorState, dispatch: Dispatch, pos: number) => {
	if (dispatch) {
		insertNodeAtPos(state, dispatch, pos, "title");
	}
	return true;
};

export const enableCaption = (state: EditorState, dispatch: Dispatch, pos: number) => {
	if (dispatch) {
		insertNodeAtPos(state, dispatch, pos, "figcaption");
	}
};

const disableTitle = (state: EditorState, dispatch: Dispatch) => {
	const { node } = state.selection as NodeSelection;
	const isActive = node?.type.name === "figure";
};
