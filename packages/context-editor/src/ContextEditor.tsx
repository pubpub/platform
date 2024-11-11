"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ProsemirrorAdapterProvider, useNodeViewFactory } from "@prosemirror-adapter/react";
import { Node } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { AttributePanel } from "./components/AttributePanel";
import { basePlugins } from "./plugins";
import { attributePanelKey } from "./plugins/attributePanel";
import { reactPropsKey } from "./plugins/reactProps";
import { baseSchema } from "./schemas";

import "prosemirror-view/style/prosemirror.css";
import "prosemirror-gapcursor/style/gapcursor.css";

import SuggestPanel from "./components/SuggestPanel";

export interface ContextEditorProps {
	placeholder?: string;
	className?: string;
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
	const memoEditor = useMemo(() => {
		return <UnwrappedEditor {...props} />;
	}, [props]);
	return <ProsemirrorAdapterProvider>{memoEditor}</ProsemirrorAdapterProvider>;
}

function UnwrappedEditor(props: ContextEditorProps) {
	const Renderer = useMemo(() => {
		return () => {
			const AtomRenderingComponent = props.atomRenderingComponent;
			return <AtomRenderingComponent nodeProp={undefined} />;
		};
	}, [props.atomRenderingComponent]);
	const nodeViewFactory = useNodeViewFactory();
	const viewHost = useRef<HTMLDivElement | null>(null);
	const view = useRef<EditorView | null>(null);
	const [panelPosition, setPanelPosition] = useState<PanelProps>(initPanelProps);
	const [suggestData, setSuggestData] = useState<SuggestProps>(initSuggestProps);

	/* This useEffect approach of making the props available to prosemirror  */
	/* plugins from: https://discuss.prosemirror.net/t/lightweight-react-integration-example/2680 */
	useEffect(() => {
		/* Initial Render */
		const state = EditorState.create({
			doc: props.initialDoc ? baseSchema.nodeFromJSON(props.initialDoc) : undefined,
			schema: baseSchema,
			plugins: basePlugins(
				baseSchema,
				props,
				panelPosition,
				setPanelPosition,
				suggestData,
				setSuggestData
			),
		});
		if (viewHost.current) {
			view.current = new EditorView(viewHost.current, {
				state,
				nodeViews: {
					contextAtom: nodeViewFactory({
						component: Renderer,
					}),
				},
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
			view.current.setProps({
				editable: () => !props.disabled,
			});
			const tr = view.current.state.tr
				.setMeta(reactPropsKey, { ...props, suggestData, setSuggestData })
				.setMeta(attributePanelKey, { panelPosition, setPanelPosition });
			view.current?.dispatch(tr);
		}
		/* It's not clear to me that any of the props need to trigger this to re-render.  */
		/* Doing so in some cases (onChange for the EditorDash) cause an infinite re-render loop */
		/* Figure out what I actually need to render on, and then clean up any useMemo calls if necessary */
	}, [props, suggestData, panelPosition]);
	return (
		<div
			id="context-editor-container"
			className={`relative max-w-screen-sm ${props.disabled ? "disabled" : ""} ${props.className}`}
		>
			<div ref={viewHost} className="font-serif" />
			<AttributePanel panelPosition={panelPosition} viewRef={view} />
			<SuggestPanel {...suggestData} />
		</div>
	);
}
