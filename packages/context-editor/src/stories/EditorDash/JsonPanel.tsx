import React, { useMemo, useState } from "react";

export default function JsonPanel({ editorState }) {
	return (
		<>
			<h2 className="sticky left-0 top-0">Doc JSON</h2>
			<div className="panel-content">
				<pre>{JSON.stringify(editorState.doc.toJSON(), null, 2)}</pre>
			</div>
		</>
	);
}
