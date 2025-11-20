import type { EditorState } from "prosemirror-state"

import React from "react"
import JsonView from "@uiw/react-json-view"

type Props = {
	editorState: EditorState
}

export default function JsonPanel({ editorState }: Props) {
	return (
		<>
			<h2 className="sticky top-0 left-0">Doc JSON</h2>
			<div className="panel-content">
				{/* <pre>{JSON.stringify(editorState.doc.toJSON(), null, 2)}</pre> */}
				<JsonView
					value={editorState.doc.toJSON()}
					displayDataTypes={false}
					displayObjectSize={false}
					enableClipboard={false}
				/>
			</div>
		</>
	)
}
