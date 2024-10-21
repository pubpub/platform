import React, { useEffect, useMemo, useRef, useState } from "react";
import { ProsemirrorAdapterProvider, useNodeViewFactory } from "@prosemirror-adapter/react";
import { Node } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { AttributePanel } from "./components/AttributePanel";
// import applyDevTools from "prosemirror-dev-tools";
import { basePlugins } from "./plugins";
import { attributePanelKey } from "./plugins/attributePanel";
import { reactPropsKey } from "./plugins/reactProps";
import { baseSchema } from "./schemas";

import "./style.css";
import "prosemirror-view/style/prosemirror.css";
import "prosemirror-gapcursor/style/gapcursor.css";

import { suggest } from "prosemirror-suggest";

import ContextAtom from "./components/ContextAtom";
import SuggestPanel from "./components/SuggestPanel";

export interface ContextEditorProps {
	placeholder?: string;
	initialDoc?: object;
	pubId: string;
	pubTypeId: string;
	pubTypes: object /* pub types in given context */;
	getPubs: (filter: string) => Promise<any[]>;
	getPubById: () => {} /* function to get a pub, both for autocomplete, and for id? */;
	onChange: (
		state: any
	) => void /* Something that passes up view, state, etc so parent can handle onSave, etc */;
	atomRenderingComponent: any /* A react component that takes in the ContextAtom pubtype and renders it accordingly */;
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
	return (
		<ProsemirrorAdapterProvider>
			{memoEditor}
		</ProsemirrorAdapterProvider>
	);
}

function UnwrappedEditor(props: ContextEditorProps) {
	const Renderer = useMemo(() => {
		return () => {
			return <ContextAtom />;
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
		<div id="context-editor-container" className="relative max-w-screen-sm">
			<div ref={viewHost} className="font-serif" />
			<AttributePanel panelPosition={panelPosition} viewRef={view} />
			<SuggestPanel {...suggestData} />
		</div>
	);
}

/* 
Notes:

- All saves happen at the end when "save" or equialent is clicked
At that point, it parses the doc and pulls out all the field values
that need to be persisted to different pubs.
- For IncludeAtom blocks I think we need to pass in a rendering function that is given a
prosemirror node and returns a rendered react output. That component is then used 
by the NodeView to put whatever we need in the doc.
*/

/* 
NodeView provider could:
- Create a bunch of objects with ids
- Have those id values parsed
- Rendered as portals by some provider

*/

/* 
1. [x] site preview first pass
2. ! better real content in doc
	- image
	- video
	- dataset
	- figure?
3. ! Pub panel redesign (give headers between each pub)
4. ! Make contextatom and doc decoration titles better (pull from pubtype)
5. Make autocomplete pull from existing content data
6. Put together talking points for demo
	- Why structure
	- the doc itself is simpler than last, exports structure and complexity to pub types (and the renderer we choose to use)
	- Need 1) default render type checkbox, 2)
*/