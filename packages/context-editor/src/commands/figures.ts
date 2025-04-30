import type { EditorState, NodeSelection } from "prosemirror-state";

import type { Dispatch } from "./types";

const enableTitle = (state: EditorState, dispatch: Dispatch) => {
	const { node } = state.selection as NodeSelection;
	const isActive = node?.type.name === "figure";
};
