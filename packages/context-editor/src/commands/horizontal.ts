import { EditorState, NodeSelection } from "prosemirror-state";

import type { Dispatch } from "./types";
import { insertNodeAfterSelection } from "../utils/nodes";
import { createCommandSpec } from "./util";

const createHorizontal = (state: EditorState, dispatch?: Dispatch) => {
	if (dispatch) {
		insertNodeAfterSelection(state, dispatch, "horizontal_rule");
	}

	return true;
};

const isHorizontalActive = (state: EditorState) => {
	const { node } = state.selection as NodeSelection;
	return node && node.type.name === "horizontal_rule";
};

export const insertHorizontalLine = createCommandSpec((dispatch, state) => ({
	run: () => createHorizontal(state, dispatch),
	canRun: createHorizontal(state),
	isActive: isHorizontalActive(state),
}));
