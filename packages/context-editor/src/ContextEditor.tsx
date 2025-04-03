"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
	ProsemirrorAdapterProvider,
	useNodeViewFactory,
	usePluginViewFactory,
} from "@prosemirror-adapter/react";
import { Node } from "prosemirror-model";
import { EditorState, Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { AttributePanel } from "./components/AttributePanel";
import { MenuBar } from "./components/MenuBar";
import { basePlugins } from "./plugins";
import { attributePanelKey } from "./plugins/attributePanel";
import { reactPropsKey } from "./plugins/reactProps";
import { baseSchema } from "./schemas";

import "prosemirror-view/style/prosemirror.css";
import "prosemirror-gapcursor/style/gapcursor.css";
// For math
import "@benrbray/prosemirror-math/dist/prosemirror-math.css";
import "katex/dist/katex.min.css";

import { cn } from "utils";

import SuggestPanel from "./components/SuggestPanel";

const MENU_BAR_ID = "context-editor-menu-container";
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

export interface PanelProps {
	top: number;
	left: number;
	right: number | string;
	bottom: number;
	pos: number;
	node?: Partial<Node>;
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
	const pluginViewFactory = usePluginViewFactory();
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
			plugins: [
				...basePlugins(
					baseSchema,
					props,
					panelPosition,
					setPanelPosition,
					suggestData,
					setSuggestData
				),
				...(props.hideMenu
					? []
					: [
							new Plugin({
								view: pluginViewFactory({
									component: () => <MenuBar upload={props.upload} />,
									root: () => {
										return document.getElementById(MENU_BAR_ID) as HTMLElement;
									},
								}),
							}),
						]),
			],
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
			className={`relative isolate max-w-screen-sm ${props.disabled ? "disabled" : ""}`}
		>
			<div id={MENU_BAR_ID} className="sticky top-0 z-10"></div>
			<div ref={viewHost} className={cn("font-serif", props.className)} />
			<AttributePanel panelPosition={panelPosition} viewRef={view} />
			<SuggestPanel {...suggestData} />
		</div>
	);
}
