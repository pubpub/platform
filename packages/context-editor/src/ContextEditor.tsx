import React, { useEffect, useRef } from "react";
import { baseKeymap } from "prosemirror-commands";
import { gapCursor } from "prosemirror-gapcursor";
import { undo, redo, history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { schema } from "prosemirror-schema-basic";
import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import "./contextEditor.css";
import "prosemirror-view/style/prosemirror.css";
import "prosemirror-gapcursor/style/gapcursor.css";

export interface ContextEditorProps {
	placeholder?: string;
}
const reactPropsKey = new PluginKey("reactProps");
function reactProps(initialProps: ContextEditorProps) {
	return new Plugin({
		key: reactPropsKey,
		state: {
			init: () => initialProps,
			apply: (tr, prev) => tr.getMeta(reactPropsKey) || prev,
		},
	});
}

export function ContextEditor(props: ContextEditorProps) {
	const viewHost = useRef<EditorView | null>(null);
	const view = useRef<EditorView | null>(null);

	/* This useEffect approach of making the props available to prosemirror  */
	/* plugins from: https://discuss.prosemirror.net/t/lightweight-react-integration-example/2680 */
	useEffect(() => {
		// initial render
		const state = EditorState.create({
			schema,
			plugins: [
				history(),
				gapCursor(),
				keymap({ "Mod-z": undo, "Mod-y": redo }),
				keymap(baseKeymap),
				reactProps(props),
			],
		});
		view.current = new EditorView(viewHost.current, { state });
		return () => view.current?.destroy();
	}, []);

	useEffect(() => {
		// every render
		if (view.current) {
			const tr = view.current.state.tr.setMeta(reactPropsKey, props);
			view.current?.dispatch(tr);
		}
	});

	return <div ref={viewHost} />;
}
