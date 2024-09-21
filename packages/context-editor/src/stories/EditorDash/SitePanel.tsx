import React, { useMemo, useState } from "react";
import { DOMSerializer, Fragment } from "prosemirror-model";
import { renderToString } from "react-dom/server";

import ContextAtom from "../../components/ContextAtom";

export default function JsonPanel({ editorState }) {
	let div;

	const domSerializer = DOMSerializer.fromSchema(editorState.schema);
	domSerializer.nodes.contextAtom = (node) => {
		const testdiv = document.createElement("div");
		console.log("node", node);
		testdiv.innerHTML = renderToString(<ContextAtom nodeProp={node} />);
		return testdiv;
	};
	console.log("domSerializer", domSerializer);
	div = document.createElement("div");
	domSerializer.serializeFragment(Fragment.from(editorState.doc.content), {}, div);

	return (
		<>
			<h2 className="sticky left-0 top-0">Site</h2>
			<div className="panel-content prose">
				{div && <div dangerouslySetInnerHTML={{ __html: div.innerHTML }} />}
			</div>
		</>
	);
}
