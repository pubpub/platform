import React, { useMemo, useState } from "react";
import { DOMSerializer, Fragment } from "prosemirror-model";
import { renderToString } from "react-dom/server";

import ContextAtom from "../../components/ContextAtom";

export default function JsonPanel({ editorState }) {
	const [style, setStyle] = useState("base");
	let div;

	const domSerializer = DOMSerializer.fromSchema(editorState.schema);
	domSerializer.nodes.contextAtom = (node) => {
		const testdiv = document.createElement("div");
		console.log("node", node);
		testdiv.innerHTML = renderToString(<ContextAtom nodeProp={node} />);
		return testdiv;
	};
	// console.log("domSerializer", domSerializer);
	div = document.createElement("div");
	domSerializer.serializeFragment(Fragment.from(editorState.doc.content), {}, div);

	const styles = ["base", "dark", "scholar"];
	const styleColors = ["bg-neutral-200", "bg-emerald-100", "bg-orange-100"];
	return (
		<>
			<h2 className="sticky left-0 top-0 flex items-center justify-between">
				<span>Site</span>
				<span className="flex space-x-2">
					{styles.map((styleName, index) => {
						return (
							<button
								key={styleName}
								className={`h-6 w-6 rounded-full ${styleColors[index]} ${style === styleName ? "border-2 border-black" : "border border-neutral-500"}`}
								onClick={() => {
									setStyle(styleName);
								}}
							/>
						);
					})}
				</span>
			</h2>

			<div className={`panel-content prose ${style}`}>
				{div && <div dangerouslySetInnerHTML={{ __html: div.innerHTML }} />}
			</div>
		</>
	);
}
