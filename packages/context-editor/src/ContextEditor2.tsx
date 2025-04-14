"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ProseMirror, ProseMirrorDoc, reactKeys } from "@handlewithcare/react-prosemirror";
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

import { S } from "../playwright-report/trace/assets/defaultSettingsView-DTenqiGw";
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
	const Renderer = useMemo(() => {
		return () => {
			const AtomRenderingComponent = props.atomRenderingComponent;
			return <AtomRenderingComponent nodeProp={undefined} />;
		};
	}, [props.atomRenderingComponent]);

	const [panelPosition, setPanelPosition] = useState<PanelProps>(initPanelProps);
	const [suggestData, setSuggestData] = useState<SuggestProps>(initSuggestProps);

	const [editorState, setEditorState] = useState(
		EditorState.create({
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
				reactKeys(),
			],
		})
	);

	return (
		<ProseMirror
			state={editorState}
			dispatchTransaction={(tr) => {
				setEditorState((s) => s.apply(tr));
			}}
		>
			<ProseMirrorDoc />
			<AttributePanel />
		</ProseMirror>
	);
}
