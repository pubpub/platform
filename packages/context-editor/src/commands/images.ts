import type { EditorState, NodeSelection } from "prosemirror-state"

export const isImageActive = (state: EditorState) => {
	const { node } = state.selection as NodeSelection
	return node && node.type.name === "image"
}
