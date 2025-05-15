"use client";

import type { NodeViewComponentProps } from "@handlewithcare/react-prosemirror";

import "prosemirror-gapcursor/style/gapcursor.css";
import "prosemirror-view/style/prosemirror.css";
// For math
import "@benrbray/prosemirror-math/dist/prosemirror-math.css";
import "katex/dist/katex.min.css";

import type { Node } from "prosemirror-model";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

import React, { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { ProseMirror, ProseMirrorDoc, reactKeys } from "@handlewithcare/react-prosemirror";
import { EditorState } from "prosemirror-state";
import { fixTables } from "prosemirror-tables";

import { cn } from "utils";
import { tryCatch } from "utils/try-catch";

import { AttributePanel } from "./components/AttributePanel";
import { MenuBar } from "./components/MenuBar";
import SuggestPanel from "./components/SuggestPanel";
import { basePlugins } from "./plugins";
import { baseSchema } from "./schemas";
import { EMPTY_DOC } from "./utils/emptyDoc";
import { htmlToProsemirror } from "./utils/serialize";

export interface ContextEditorProps {
	placeholder?: string;
	className?: string /* classname for the editor view */;
	disabled?: boolean;
	// initialDoc?: Node;
	initialHtml?: string;
	pubId: string /* id of the current pub whose field is being directly edited */;
	pubTypeId: string /* id of the current pubType of the pub whose field is being directly edited */;
	pubTypes: object /* pub types in given context */;
	getPubs: (filter: string) => Promise<any[]>;
	getPubById: (
		id: string
	) => {} | undefined /* function to get a pub, both for autocomplete, and for id? */;
	onChange: (
		state: EditorState,
		initialDoc: Node,
		initialHtml?: string
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

const parseHtmlToDoc = (html: string) => {
	const [err, prosemirrorNode] = tryCatch(() => htmlToProsemirror(html));
	return [err, prosemirrorNode ?? getEmptyDoc()] as const;
};

const getEmptyDoc = () => baseSchema.nodeFromJSON(EMPTY_DOC);

const ContextEditor = memo(function ContextEditor(props: ContextEditorProps) {
	const [suggestData, setSuggestData] = useState<SuggestProps>(initSuggestProps);

	const [parseError, initialDoc] = useMemo(() => {
		if (!props.initialHtml) {
			return [undefined, getEmptyDoc()];
		}

		return parseHtmlToDoc(props.initialHtml);
	}, [props.initialHtml]);

	const [editorState, setEditorState] = useState(() => {
		let state = EditorState.create({
			doc: initialDoc,
			schema: baseSchema,
			plugins: [...basePlugins(baseSchema, props, suggestData, setSuggestData), reactKeys()],
		});
		const fix = fixTables(state);
		if (fix) {
			state = state.apply(fix.setMeta("addToHistory", false));
		}
		return state;
	});

	const nodeViews = useMemo(() => {
		return { contextAtom: props.atomRenderingComponent };
	}, [props.atomRenderingComponent]);

	useEffect(() => {
		props.onChange(editorState, initialDoc, props.initialHtml);
	}, [editorState]);

	const containerRef = useRef<HTMLDivElement>(null);
	const containerId = useId();

	if (parseError) {
		return (
			<div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-800">
				<p className="font-medium">unable to parse document</p>
				<p className="mt-1 text-sm text-red-600">{parseError.message}</p>
			</div>
		);
	}

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
				/>
			</ProseMirror>
		</div>
	);
});

export default ContextEditor;
