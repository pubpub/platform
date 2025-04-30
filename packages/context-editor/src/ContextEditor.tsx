"use client";

import type { NodeViewComponentProps } from "@handlewithcare/react-prosemirror";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
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

import { cn } from "utils";

import { EditorContextProvider } from "./components/Context";
import { MenuBar } from "./components/MenuBar";
import SuggestPanel from "./components/SuggestPanel";

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
		state: EditorState
	) => void /* Function that passes up editorState so parent can handle onSave, etc */;
	atomRenderingComponent: ForwardRefExoticComponent<
		NodeViewComponentProps & RefAttributes<any>
	> /* A react component that is given the ContextAtom pubtype and renders it accordingly */;
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
	const [suggestData, setSuggestData] = useState<SuggestProps>(initSuggestProps);
	const [editorState, setEditorState] = useState(
		EditorState.create({
			doc: props.initialDoc ? baseSchema.nodeFromJSON(props.initialDoc) : undefined,
			schema: baseSchema,
			plugins: [...basePlugins(baseSchema, props, suggestData, setSuggestData), reactKeys()],
		})
	);

	const nodeViews = useMemo(() => {
		return { contextAtom: props.atomRenderingComponent };
	}, [props.atomRenderingComponent]);

	useEffect(() => {
		props.onChange(editorState);
	}, [editorState]);

	const containerRef = useRef<HTMLDivElement>(null);
	const containerId = useId();

	return (
		<div
			id={containerId}
			ref={containerRef}
			className={cn("relative isolate max-w-screen-sm", {
				"editor-disabled": props.disabled,
			})}
		>
			<ProseMirror
				state={editorState}
				dispatchTransaction={(tr) => {
					setEditorState((s) => s.apply(tr));
				}}
				nodeViews={nodeViews}
				editable={() => !props.disabled}
				className={cn("font-serif", props.className)}
			>
				<EditorContextProvider activeNode={null} position={0}>
					{props.hideMenu ? null : (
						<div className="sticky top-0 z-10">
							<MenuBar upload={props.upload} />
						</div>
					)}
					<ProseMirrorDoc />
					<AttributePanel menuHidden={!!props.hideMenu} containerRef={containerRef} />
					<SuggestPanel
						suggestData={suggestData}
						setSuggestData={setSuggestData}
						containerRef={containerRef}
						containerId={containerId}
					/>
				</EditorContextProvider>
			</ProseMirror>
		</div>
	);
}
