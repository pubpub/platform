import type { EditorState } from "prosemirror-state"

import * as React from "react"
import { useState } from "react"
import { DOMSerializer, Fragment } from "prosemirror-model"
import { renderToString } from "react-dom/server"

import { AtomRenderer } from "../AtomRenderer"

type Props = {
	editorState: EditorState
}

export default function JsonPanel({ editorState }: Props) {
	const [style, setStyle] = useState("base")
	let div: HTMLDivElement | null = null

	const domSerializer = DOMSerializer.fromSchema(editorState.schema)
	domSerializer.nodes.contextAtom = (node) => {
		const testdiv = document.createElement("div")
		// console.log("node", node);
		testdiv.innerHTML = renderToString(<AtomRenderer nodeProps={{ node } as any} />)
		return testdiv
	}
	// console.log("domSerializer", domSerializer);
	div = document.createElement("div")
	domSerializer.serializeFragment(Fragment.from(editorState.doc.content), {}, div)

	const styles = ["base", "dark", "scholar"]
	const styleColors = ["bg-neutral-200", "bg-emerald-100", "bg-orange-100"]
	return (
		<>
			<h2 className="sticky top-0 left-0 z-20 flex items-center justify-between">
				<span>Site</span>
				<span className="flex space-x-2">
					{styles.map((styleName, index) => {
						return (
							<button
								type="button"
								key={styleName}
								className={`h-6 w-6 rounded-full ${styleColors[index]} ${style === styleName ? "border-2 border-black" : "border border-neutral-500"}`}
								onClick={() => {
									setStyle(styleName)
								}}
							/>
						)
					})}
				</span>
			</h2>

			<div className={`panel-content prose ${style}`}>
				{div && <div dangerouslySetInnerHTML={{ __html: div.innerHTML }} />}
			</div>
		</>
	)
}
