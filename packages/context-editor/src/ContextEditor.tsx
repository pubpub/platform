"use client";

import React, { useMemo, useState } from "react";
import { ProseMirror, ProseMirrorDoc, reactKeys } from "@handlewithcare/react-prosemirror";
import { EditorState } from "prosemirror-state";

import { AttributePanel } from "./components/AttributePanel";
import { basePlugins } from "./plugins";
import { baseSchema } from "./schemas";

import "prosemirror-view/style/prosemirror.css";
import "prosemirror-gapcursor/style/gapcursor.css";
// For math
import "@benrbray/prosemirror-math/dist/prosemirror-math.css";
import "katex/dist/katex.min.css";

import { EditorContextProvider } from "./components/Context";

export interface ContextEditorProps {
	placeholder?: string;
	className?: string /* classname for the editor view */;
	disabled?: boolean;
	initialDoc?: object;
	pubId: string /* id of the current pub whose field is being directly edited */;
	pubTypeId: string /* id of the current pubType of the pub whose field is being directly edited */;
	pubTypes: object /* pub types in given context */;
	getPubs: (filter: string) => Promise<any[]>;
	getPubById: (
		id: string
	) => {} | undefined /* function to get a pub, both for autocomplete, and for id? */;
	onChange: (
		state: any
	) => void /* Function that passes up editorState so parent can handle onSave, etc */;
	atomRenderingComponent: React.ComponentType<{
		nodeProp: any;
	}> /* A react component that is given the ContextAtom pubtype and renders it accordingly */;
	hideMenu?: boolean;
	upload: (fileName: string) => Promise<string | { error: string }>;
}

export interface SuggestProps {
	isOpen: boolean;
	selectedIndex: number;
	items: any[];
	filter: string;
}

const initSuggestProps: SuggestProps = {
	isOpen: false,
	selectedIndex: 0,
	items: [],
	filter: "",
};

export default function ContextEditor(props: ContextEditorProps) {
	const Renderer = useMemo(() => {
		return () => {
			const AtomRenderingComponent = props.atomRenderingComponent;
			return <AtomRenderingComponent nodeProp={undefined} />;
		};
	}, [props.atomRenderingComponent]);

	const [suggestData, setSuggestData] = useState<SuggestProps>(initSuggestProps);

	const [editorState, setEditorState] = useState(
		EditorState.create({
			doc: props.initialDoc ? baseSchema.nodeFromJSON(props.initialDoc) : undefined,
			schema: baseSchema,
			plugins: [...basePlugins(baseSchema, props, suggestData, setSuggestData), reactKeys()],
		})
	);

	return (
		<div
			id="context-editor-container"
			className={`relative isolate max-w-screen-sm ${props.disabled ? "disabled" : ""}`}
		>
			<ProseMirror
				state={editorState}
				dispatchTransaction={(tr) => {
					setEditorState((s) => s.apply(tr));
				}}
			>
				<EditorContextProvider activeNode={null} position={0}>
					<>
						<ProseMirrorDoc />
						<AttributePanel />
					</>
				</EditorContextProvider>
			</ProseMirror>
		</div>
	);
}
