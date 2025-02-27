import type { Command } from "prosemirror-state";

import { EditorState, NodeSelection } from "prosemirror-state";

import type { Dispatch } from "./types";
import { insertNodeIntoEditor } from "../utils/nodes";
import { createCommandSpec } from "./util";

type MathType = "math_inline" | "math_display";

const toggleInlineOrBlock: Command = (state: EditorState, dispatch?: Dispatch) => {
	const { node } = state.selection as NodeSelection;
	const canRun = node && (node.type.name === "math_inline" || node.type.name === "math_display");
	if (!canRun) {
		return false;
	}
	const isDisplay = node.type.name === "math_display";
	if (dispatch) {
		const {
			schema: {
				nodes: { math_display: displayType, math_inline: inlineType },
			},
		} = state;
		const swapNodeType = isDisplay ? inlineType : displayType;
		const transaction = state.tr.replaceSelectionWith(
			swapNodeType.create({}, node.content),
			true
		);
		dispatch(transaction);
	}
	return true;
};

const createMathToggle = (state: EditorState, type: MathType, dispatch?: Dispatch) => {
	// Q: should this ever return false? (when can this func not be run?)
	const { node } = state.selection as NodeSelection;
	const isActive = node && node.type.name === type;

	const other = type === "math_inline" ? "math_display" : "math_inline";
	const isOther = node && node.type.name === other;
	if (dispatch) {
		if (isOther) {
			toggleInlineOrBlock(state, dispatch);
		} else {
			if (!isActive) {
				// Insert a new math block
				insertNodeIntoEditor(state, dispatch, type);
			} else {
				const transaction = state.tr.replaceSelectionWith(
					state.schema.nodes.paragraph.create({}, node.content),
					true
				);
				dispatch(transaction);
			}
		}
	}

	return true;
};

const isMathActive = (state: EditorState, type: MathType) => {
	const { node } = state.selection as NodeSelection;
	return node && node.type.name === type;
};

export const mathToggleInline = createCommandSpec((dispatch, state) => ({
	run: () => createMathToggle(state, "math_inline", dispatch),
	canRun: createMathToggle(state, "math_inline"),
	isActive: isMathActive(state, "math_inline"),
}));

export const mathToggleBlock = createCommandSpec((dispatch, state) => ({
	run: () => createMathToggle(state, "math_display", dispatch),
	canRun: createMathToggle(state, "math_display"),
	isActive: isMathActive(state, "math_display"),
}));
