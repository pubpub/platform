import React, { useEffect, useRef, useState } from "react";
import applyDevTools from "prosemirror-dev-tools";
import { Node } from "prosemirror-model";
// import { baseKeymap } from "prosemirror-commands";
// import { gapCursor } from "prosemirror-gapcursor";
// import { history, redo, undo } from "prosemirror-history";
// import { keymap } from "prosemirror-keymap";
import { schema } from "prosemirror-schema-basic";
// import { inputRules } from "prosemirror-inputrules";
import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

// import blockDecoPlugin from "./blockDeco";
// import inlineDecoPlugin from "./inlineDeco";

import "./contextEditor.css";
import "prosemirror-view/style/prosemirror.css";
import "prosemirror-gapcursor/style/gapcursor.css";

// import { exampleSetup } from "prosemirror-example-setup";

import { AttributePanel } from "./AttributePanel";
import { basePlugins } from "./plugins";
import { reactPropsKey } from "./plugins/reactProps";

export interface ContextEditorProps {
	placeholder?: string;
	initialDoc?: object;
}
export interface PanelProps {
	top: number;
	left: number;
	right: number;
	bottom: number;
	pos: number;
	node?: Node;
}

const initPanelProps = {
	top: 0,
	left: 0,
	right: '100%',
	bottom: 0,
	pos: 0,
	node: undefined,
};
export function ContextEditor(props: ContextEditorProps) {
	const viewHost = useRef<EditorView | null>(null);
	const view = useRef<EditorView | null>(null);
	const [panelPosition, setPanelPosition] = useState<PanelProps>(initPanelProps);
	// const [updateFunc, setUpdateFunc] = useState(null);
	// console.log('updateFunc2', updateFunc)
	/* This useEffect approach of making the props available to prosemirror  */
	/* plugins from: https://discuss.prosemirror.net/t/lightweight-react-integration-example/2680 */
	useEffect(() => {
		// initial render
		const state = EditorState.create({
			doc: props.initialDoc ? schema.nodeFromJSON(props.initialDoc) : undefined,
			schema,
			plugins: basePlugins(schema, setPanelPosition),
			// [
			// reactProps(props),
			// panelPlugin(setPanelPosition),
			// panel(set),
			// history(),
			// ...exampleSetup({ schema, menuBar: false }),
			// gapCursor(),
			// keymap({ "Mod-z": undo, "Mod-y": redo }),
			// keymap(baseKeymap),
			// blockDecoPlugin(),
			// inlineDecoPlugin(),
			// inputRules(),
			// ],
		});
		view.current = new EditorView(viewHost.current, {
			state,
			handleDOMEvents: {
				focus: () => {
					setPanelPosition(initPanelProps);
				},
			},
		});
		// applyDevTools(view.current);
		return () => view.current?.destroy();
	}, []);

	useEffect(() => {
		// every render
		if (view.current) {
			const tr = view.current.state.tr.setMeta(reactPropsKey, props);
			view.current?.dispatch(tr);
		}
	});
	console.log("Main component renrender");
	return (
		<div className="editor-wrapper">
			<div ref={viewHost} />
			<AttributePanel panelPosition={panelPosition} viewRef={view} />
		</div>
	);
}

/* 
[x] Add decorations for every block and inline elem
[x] Put event listeners on those decorations
[x] Have it trigger a popup of some kind that's managed as a sibling
[x] edits the prosemirror doc through some function calls
[ ] Clean code to be better structured
[ ] Add plugins, schemas, etc for base work
[ ] Build autocomplete plugin that looks at pubtype props
[ ] Build reference schema nodes
[ ] 
[ ]  
*/

/* 
All saves happen at the end when "save" or equialent is clicked
At that point, it parses the doc and pulls out all the field values
that need to be persisted to different pubs.

*/
