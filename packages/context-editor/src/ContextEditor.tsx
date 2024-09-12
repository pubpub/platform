import React, { useEffect, useRef, useState } from "react";
// import applyDevTools from "prosemirror-dev-tools";
import { Node } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { AttributePanel } from "./AttributePanel";
import { basePlugins } from "./plugins";
import { reactPropsKey } from "./plugins/reactProps";
import { baseSchema } from "./schemas";

import "./style.css";
import "prosemirror-view/style/prosemirror.css";
import "prosemirror-gapcursor/style/gapcursor.css";

export interface ContextEditorProps {
	placeholder?: string;
	initialDoc?: object;
}
export interface PanelProps {
	top: number;
	left: number;
	right: number | string;
	bottom: number;
	pos: number;
	node?: Node;
}

const initPanelProps: PanelProps = {
	top: 0,
	left: 0,
	right: "100%",
	bottom: 0,
	pos: 0,
	node: undefined,
};
export function ContextEditor(props: ContextEditorProps) {
	const viewHost = useRef<HTMLDivElement | null>(null);
	const view = useRef<EditorView | null>(null);
	const [panelPosition, setPanelPosition] = useState<PanelProps>(initPanelProps);

	/* This useEffect approach of making the props available to prosemirror  */
	/* plugins from: https://discuss.prosemirror.net/t/lightweight-react-integration-example/2680 */
	useEffect(() => {
		/* Initial Render */
		const state = EditorState.create({
			doc: props.initialDoc ? baseSchema.nodeFromJSON(props.initialDoc) : undefined,
			schema: baseSchema,
			plugins: basePlugins(baseSchema, setPanelPosition),
		});
		if (viewHost.current) {
			view.current = new EditorView(viewHost.current, {
				state,
				handleDOMEvents: {
					focus: () => {
						/* Reset the panelProps when the editor is focused */
						setPanelPosition(initPanelProps);
					},
				},
			});
		}
		// applyDevTools(view.current);
		return () => view.current?.destroy();
	}, []);

	useEffect(() => {
		/* Every Render */
		if (view.current) {
			const tr = view.current.state.tr.setMeta(reactPropsKey, props);
			view.current?.dispatch(tr);
		}
	});

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
[x] Clean code to be better structured
[ ] Add plugins, schemas, etc for base work
[ ] Build autocomplete plugin that looks at pubtype props
[ ] Build reference schema nodes
*/

/* 
Notes:

- All saves happen at the end when "save" or equialent is clicked
At that point, it parses the doc and pulls out all the field values
that need to be persisted to different pubs.
*/
