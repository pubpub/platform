import type { Node } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";

import React, { useMemo } from "react";
import { useEditorEventCallback } from "@handlewithcare/react-prosemirror";

import { toggleFigureNode } from "../../commands/figures";
import { MenuSwitchField } from "./MenuFields";

type LinkMenuProps = {
	node: Node;
	nodePos: number;
	onChange: (attrs: Record<string, unknown>) => void;
};
export const FigureMenu = (props: LinkMenuProps) => {
	const childNodeTypes = useMemo(() => {
		const set = new Set<string>();
		for (const child of props.node.children) {
			set.add(child.type.name);
		}
		return set;
	}, [props.node]);

	const makeNodeToggle = (name: "title" | "figcaption" | "credit" | "license") => {
		return (view: EditorView) => {
			if (props.nodePos === null) {
				return;
			}
			toggleFigureNode(view.state, view.dispatch)(props.nodePos, name);
		};
	};

	const toggleTitle = useEditorEventCallback(makeNodeToggle("title"));
	const toggleCaption = useEditorEventCallback(makeNodeToggle("figcaption"));
	const toggleCredit = useEditorEventCallback(makeNodeToggle("credit"));
	const toggleLicense = useEditorEventCallback(makeNodeToggle("license"));

	return (
		<div className="flex flex-col gap-4">
			<MenuSwitchField
				name="title"
				label="Title"
				value={childNodeTypes.has("title")}
				onChange={toggleTitle}
			/>
			<MenuSwitchField
				name="caption"
				label="Caption"
				value={childNodeTypes.has("figcaption")}
				onChange={toggleCaption}
			/>
			{childNodeTypes.has("image") && (
				<>
					<MenuSwitchField
						name="credit"
						label="Credit"
						value={childNodeTypes.has("credit")}
						onChange={toggleCredit}
					/>
					<MenuSwitchField
						name="license"
						label="License"
						value={childNodeTypes.has("license")}
						onChange={toggleLicense}
					/>
				</>
			)}
		</div>
	);
};
