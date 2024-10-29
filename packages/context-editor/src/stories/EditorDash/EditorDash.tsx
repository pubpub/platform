import React, { useMemo, useState } from "react";
import { Braces, Files, PanelTop } from "lucide-react";

import { Button } from "ui/button";

import ContextEditor, { type ContextEditorProps } from "../../ContextEditor";
import JsonPanel from "./JsonPanel";
import PubsPanel from "./PubsPanel";
import SitePanel from "./SitePanel";

import "./dashStyles.css";

export default function EditorDash(props: ContextEditorProps) {
	const [editorState, setEditorState] = useState(null);
	const [activeDash, setActiveDash] = useState("");
	const memoEditor = useMemo(() => {
		return (
			<ContextEditor
				{...props}
				onChange={(newState) => {
					setEditorState(newState);
				}}
			/>
		);
	}, [props]);

	const dashes = [
		{ key: "json", icon: <Braces size={16} /> },
		{ key: "pubs", icon: <Files size={16} /> },
		{ key: "site", icon: <PanelTop size={16} /> },
	];
	return (
		<div className="bg-[#f4f4f4] min-h-screen">
			<div className="fixed right-0 flex h-screen flex-col justify-center space-y-2 p-2">
				{dashes.map((dash) => {
					return (
						<Button
							key={dash.key}
							variant="outline"
							size="icon"
							className={`h-8 w-8 rounded-full  hover:border-neutral-400 ${activeDash === dash.key ? "border-neutral-400 bg-white hover:bg-white" : "border-neutral-300"}`}
							onClick={() => {
								setActiveDash(activeDash === dash.key ? "" : dash.key);
							}}
						>
							{dash.icon}
						</Button>
					);
				})}
			</div>
			{memoEditor}
			{activeDash && editorState && (
				<div
					id="panel"
					className="fixed drop-shadow-md right-12 top-4 z-10 h-[calc(100vh-2rem)] w-[calc(50vw-1rem)] overflow-y-scroll rounded-xl border border-[#dbdbdb] bg-white"
				>
					{activeDash === "json" && <JsonPanel editorState={editorState} />}
					{activeDash === "site" && <SitePanel editorState={editorState} />}
					{activeDash === "pubs" && <PubsPanel editorState={editorState} pubId={props.pubId} />}
				</div>
			)}
		</div>
	);
}
