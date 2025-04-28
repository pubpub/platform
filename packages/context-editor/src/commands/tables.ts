import type { EditorState, NodeSelection } from "prosemirror-state";

import type { Dispatch } from "./types";
import { insertNodeAfterSelection } from "../utils/nodes";
import { createCommandSpec } from "./util";

const createTable = (state: EditorState, dispatch?: Dispatch) => {
	if (dispatch) {
		insertNodeAfterSelection(state, dispatch, "table");
	}

	return true;
};

const isTableActive = (state: EditorState) => {
	const { node } = state.selection as NodeSelection;
	return node && node.type.name === "table";
};

export const insertTable = createCommandSpec((dispatch, state) => ({
	run: () => createTable(state, dispatch),
	canRun: createTable(state),
	isActive: isTableActive(state),
}));
