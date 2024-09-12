import React, { useEffect, useRef, useState } from "react";

// import { baseKeymap } from "prosemirror-commands";
// import { gapCursor } from "prosemirror-gapcursor";
// import { history, redo, undo } from "prosemirror-history";
// import { keymap } from "prosemirror-keymap";
import { schema } from "prosemirror-schema-basic";
// import { inputRules } from "prosemirror-inputrules";
import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import blockDecoPlugin from "./blockDeco";

import "./contextEditor.css";
import "prosemirror-view/style/prosemirror.css";
import "prosemirror-gapcursor/style/gapcursor.css";

import { AttributePanel } from "./AttributePanel";
import { exampleSetup } from "prosemirror-example-setup";

export interface ContextEditorProps {
	placeholder?: string;
}
export const reactPropsKey = new PluginKey("reactProps");
function reactProps(initialProps: ContextEditorProps) {
	return new Plugin({
		key: reactPropsKey,
		state: {
			init: () => initialProps,
			apply: (tr, prev) => tr.getMeta(reactPropsKey) || prev,
		},
	});
}

export const panelKey = new PluginKey("panel");
function panelPlugin(setPanelPosition) {
	return new Plugin({
		key: panelKey,
		state: {
			init: () => setPanelPosition,
			apply: (tr, prev) => tr.getMeta(panelKey) || prev,
		},
	});
}

export function ContextEditor(props: ContextEditorProps) {
	const viewHost = useRef<EditorView | null>(null);
	const view = useRef<EditorView | null>(null);
	const [panelPosition, setPanelPosition] = useState([0,'100%',0]);

	/* This useEffect approach of making the props available to prosemirror  */
	/* plugins from: https://discuss.prosemirror.net/t/lightweight-react-integration-example/2680 */
	useEffect(() => {
		// initial render
		const state = EditorState.create({
			schema,
			plugins: [
				reactProps(props),
				panelPlugin(setPanelPosition),
				// history(),
				...exampleSetup({schema, menuBar: false}),
				// gapCursor(),
				// keymap({ "Mod-z": undo, "Mod-y": redo }),
				// keymap(baseKeymap),
				blockDecoPlugin(),
				// inputRules(),
			],
		});
		view.current = new EditorView(viewHost.current, { state, handleDOMEvents: {
			focus: ()=>{
				console.log('in focus');
				setPanelPosition([0,'100%',0])
			}
		} });
		return () => view.current?.destroy();
	}, []);

	useEffect(() => {
		// every render
		if (view.current) {
			const tr = view.current.state.tr.setMeta(reactPropsKey, props);
			view.current?.dispatch(tr);
		}
	});

	return (
		<div className="editor-wrapper">
			<div ref={viewHost} />
			<AttributePanel panelPosition={panelPosition}/>
		</div>
	);
}

/* 
Add decorations for every block and inline type
Put event listeners on those decorations
Have it trigger a popup of some kind that's managed as a sibling, but edits
the prosemirror doc through some function calls
*/


/* 
All saves happen at the end when "save" or equialent is clicked
At that point, it parses the doc and pulls out all the field values
that need to be persisted to different pubs.

*/