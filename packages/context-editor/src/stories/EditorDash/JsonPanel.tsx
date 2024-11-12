import type { EditorState } from "prosemirror-state";

import React, { useMemo, useState } from "react";
import JsonView from "@uiw/react-json-view";

type Props = {
	editorState: EditorState;
};

export default function JsonPanel({ editorState }: Props) {
	return (
		<>
			<h2 className="sticky left-0 top-0">Doc JSON</h2>
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
	);
}
