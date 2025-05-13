import React, { useMemo, useState } from "react";
import {
	useEditorEffect,
	useEditorEventCallback,
	useEditorState,
} from "@handlewithcare/react-prosemirror";
import { TextSelection } from "prosemirror-state";
import { createPortal } from "react-dom";

import { replaceMark } from "../commands/marks";
import { MENU_BAR_HEIGHT } from "./MenuBar";
import { AdvancedOptions } from "./menus/AdvancedOptions";
import { LinkMenu } from "./menus/LinkMenu";
import { MarkMenu } from "./menus/MarkMenu";
import { NodeMenu } from "./menus/NodeMenu";

const animationTimeMS = 150;
const animationHeightMS = 100;

interface PanelProps {
	top: number;
	left: number;
	right: number | string;
	panelLeft: number;
	bottom: number;
}

const initPanelProps: PanelProps = {
	top: 0,
	left: 0,
	right: 1000,
	panelLeft: 0,
	bottom: 0,
};

export function AttributePanel({
	menuHidden,
	containerRef,
}: {
	menuHidden: boolean;
	containerRef: React.RefObject<HTMLDivElement | null>;
}) {
	const [offset, setOffset] = useState(initPanelProps);
	const [height, setHeight] = useState(0);
	const state = useEditorState();
	const nodePos = state.selection.$anchor.pos;
	const node = useMemo(() => state.selection.$anchor.nodeAfter, [state]);

	useEditorEffect(
		(view) => {
			if (node === null) {
				setOffset({ ...offset, right: 1000 });
				return;
			}

			if (!node) {
				if (!view.hasFocus()) {
					return;
				}
				// Reset right position so line animation still works when opening the panel again
				setOffset({ ...offset, right: 1000 });
				return;
			}

			// The attribute panel itself may be focused--don't change the node while it is open
			// This is primarily for the case where you are editing the id/class of a node.
			if (!view.hasFocus() && node && node.isBlock && !node.eq(node)) {
				return;
			}

			if (Object.keys(node.attrs).length === 0 && node.marks.length === 0) {
				setOffset({ ...offset, right: 1000 });
				return;
			}
		},
		[state, node]
	);

	useEditorEffect(
		(view) => {
			if (node === null) {
				setHeight(0);
				return;
			}

			if (node) {
				const viewClientRect = view.dom.getBoundingClientRect();
				const coords = view.coordsAtPos(nodePos);
				const topBase = coords.top - 1 - viewClientRect.top;
				const top = menuHidden ? topBase : topBase + MENU_BAR_HEIGHT;
				setOffset({
					...offset,
					top,
					// +16 for padding
					left: coords.left - viewClientRect.left + 16,
					panelLeft: containerRef.current?.clientWidth ?? 0,
					right: -1,
				});
				setTimeout(() => {
					setHeight(300);
				}, animationTimeMS);
			} else {
				setHeight(0);
			}
		},
		[node, nodePos, containerRef]
	);

	const updateMarkAttrs = useEditorEventCallback(
		(view, index: number, attrs: Record<string, unknown>) => {
			if (!node) return;
			const mark = node.marks[index];
			const markAttrs = { ...mark.attrs, ...attrs };
			replaceMark(mark, markAttrs)(view.state, view.dispatch);
		}
	);

	const updateNodeAttrs = useEditorEventCallback((view, attrs: Record<string, unknown>) => {
		if (!view || !node) return;
		let tr = view.state.tr.setNodeMarkup(
			nodePos,
			node.type,
			{ ...node.attrs, ...attrs },
			node.marks
		);
		tr = tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map(nodePos)));
		view.dispatch(tr);
	});

	if (!(node && containerRef.current)) {
		return null;
	}

	if (node.type.name === "text" && node.marks.length === 0) {
		return null;
	}

	return createPortal(
		<>
			<div
				className="drop-shadow-lg"
				style={{
					position: "absolute",
					background: "#fff",
					top: offset.top,
					left: offset.panelLeft,
					width: 300,
					padding: "1em",
					height: height,
					opacity: height ? 1 : 0,
					overflow: "scroll",
					borderLeft: "1px solid #999",
					borderRight: "1px solid #999",
					borderTop: `${height ? 1 : 0}px solid #999`,
					borderBottom: `${height ? 1 : 0}px solid #999`,
					borderRadius: "0px 0px 4px 4px",
					transition:
						offset.top === 0
							? ""
							: `height ${animationHeightMS}ms linear, opacity ${animationHeightMS}ms linear `,
					marginTop: 2,
					marginBottom: 2,
					display: "flex",
					flexDirection: "column",
					gap: "0.5em",
				}}
				data-testid="attribute-panel"
			>
				<h2 className="text-md font-serif font-medium">
					{node.type.name}
					{node.marks.length > 0 ? (
						<> + {node.marks.map((mark) => mark.type.name).join(", ")}</>
					) : null}
				</h2>
				{node.marks.length > 0 ? (
					<MarkMenu node={node} nodePos={nodePos} onChange={updateMarkAttrs} />
				) : (
					<NodeMenu node={node} nodePos={nodePos} onChange={updateNodeAttrs} />
				)}
				<AdvancedOptions node={node} nodePos={nodePos} onChange={updateNodeAttrs} />
			</div>

			<div
				style={{
					background: "#777",
					height: "1px",
					position: "absolute",
					left: offset.left,
					top: offset.top,
					right: offset.right,
					transition: offset.top === 0 ? "" : `right ${animationTimeMS}ms linear`,
				}}
			/>
		</>,
		containerRef.current
	);
}
