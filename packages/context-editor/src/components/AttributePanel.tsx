import type { Mark } from "prosemirror-model";

import React, { useState } from "react";
import {
	useEditorEffect,
	useEditorEventCallback,
	useEditorState,
} from "@handlewithcare/react-prosemirror";
import { createPortal } from "react-dom";

import { Input } from "ui/input";
import { Label } from "ui/label";

import { useEditorContext } from "./Context";
import { MENU_BAR_HEIGHT } from "./MenuBar";
import { DataAttributes, MarkAttribute, NodeAttributes } from "./menus/DefaultAttributesMenu";
import { LinkMenu } from "./menus/LinkMenu";

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
	const [position, setPosition] = useState(initPanelProps);
	const [height, setHeight] = useState(0);
	const state = useEditorState();
	const {
		activeNode,
		position: activeNodePosition,
		setActiveNode,
		setPosition: setActiveNodePosition,
	} = useEditorContext();

	useEditorEffect(
		(view) => {
			const node = state.selection.$from.nodeAfter;
			if (!node) {
				setActiveNode(null);
				// Reset right position so line animation still works when opening the panel again
				setPosition({ ...position, right: 1000 });
				return;
			}

			// The attribute panel itself may be focused--don't change the node while it is open
			// This is primarily for the case where you are editing the id/class of a node.
			if (!view.hasFocus() && activeNode && activeNode.isBlock && !node.eq(activeNode)) {
				return;
			}

			if (Object.keys(node.attrs).length === 0 && node.marks.length === 0) {
				setPosition({ ...position, right: 1000 });
				setActiveNode(null);
				return;
			}

			setActiveNode(node);
			setActiveNodePosition(state.selection.$from.pos);
		},
		[state]
	);
	// const container = document.getElementById(containerId);

	useEditorEffect(
		(view) => {
			if (activeNode) {
				const viewClientRect = view.dom.getBoundingClientRect();
				const coords = view.coordsAtPos(activeNodePosition);
				const topBase = coords.top - 1 - viewClientRect.top;
				const top = menuHidden ? topBase : topBase + MENU_BAR_HEIGHT;
				setPosition({
					...position,
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
		[activeNode, activeNodePosition, containerRef]
	);

	const updateMarkAttr = useEditorEventCallback(
		(view, index: number, attrKey: string, value: string | null) => {
			if (!view || !activeNode) return;
			const markToReplace = nodeMarks[index];
			const newMarks: Array<Omit<Mark, "attrs"> & { [attr: string]: any }> = [
				...(activeNode?.marks ?? []),
			];
			newMarks[index].attrs[attrKey] = value;

			const newMark = view.state.schema.marks[markToReplace.type.name].create({
				...markToReplace.attrs,
				[attrKey]: value,
			});

			if (!newMark) {
				return null;
			}

			view.dispatch(
				view.state.tr.addMark(
					activeNodePosition,
					activeNodePosition + (activeNode.nodeSize || 0),
					newMark
				)
			);
		}
	);

	/** Bulk update version of updateMarkAttr */
	const updateMarkAttrs = useEditorEventCallback(
		(view, index: number, attrs: Record<string, string | null>) => {
			if (!view || !activeNode) return;
			const markToReplace = nodeMarks[index];
			const newMarks: Array<Omit<Mark, "attrs"> & { [attr: string]: any }> = [
				...(activeNode?.marks ?? []),
			];
			newMarks[index].attrs = attrs;

			const newMark = view.state.schema.marks[markToReplace.type.name].create({
				...markToReplace.attrs,
				...attrs,
			});

			if (!newMark) {
				return null;
			}

			view.dispatch(
				view.state.tr.addMark(
					activeNodePosition,
					activeNodePosition + (activeNode.nodeSize || 0),
					newMark
				)
			);
		}
	);

	const updateAttr = useEditorEventCallback((view, attrKey: string, value: string) => {
		if (!view || !activeNode) return;
		view.dispatch(
			view.state.tr.setNodeMarkup(
				activeNodePosition,
				activeNode.type,
				{ ...activeNode.attrs, [attrKey]: value },
				activeNode.marks
			)
		);
		const updatedNode = view.state.doc.nodeAt(activeNodePosition);
		setActiveNode(updatedNode);
	});

	const updateData = useEditorEventCallback((view, attrKey: string, value: string) => {
		if (!view || !activeNode) return;
		view.dispatch(
			view.state.tr.setNodeMarkup(
				activeNodePosition,
				activeNode.type,
				{ ...activeNode.attrs, data: { ...nodeAttrs.data, [attrKey]: value } },
				activeNode.marks
			)
		);
		const updatedNode = view.state.doc.nodeAt(activeNodePosition);
		setActiveNode(updatedNode);
	});

	const labelClass = "font-normal text-xs";
	const inputClass = "h-8 text-xs rounded-sm border-neutral-300";

	if (!activeNode) {
		return null;
	}
	const nodeAttrs = activeNode.attrs || {};
	const nodeMarks = activeNode.marks || [];

	// Marks will automatically show names, so it is only the 'inline' types
	// that are not marks that need to be specifically rendered
	const showName = activeNode?.type?.name === "math_inline";

	if (!containerRef.current) {
		return null;
	}

	return createPortal(
		<>
			<div
				className="drop-shadow-lg"
				style={{
					position: "absolute",
					background: "#fff",
					top: position.top,
					left: position.panelLeft,
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
						position.top === 0
							? ""
							: `height ${animationHeightMS}ms linear, opacity ${animationHeightMS}ms linear `,
				}}
				data-testid="attribute-panel"
			>
				<div className="text-sm">Attributes</div>
				{showName ? (
					<div className="mt-4 text-sm font-bold">{activeNode.type?.name}</div>
				) : null}
				<NodeAttributes nodeAttrs={nodeAttrs} updateAttr={updateAttr} />
				{nodeMarks.map((mark, index) => {
					const key = `${mark.type.name}-${activeNodePosition}`;
					if (mark.type.name === "link") {
						return (
							<LinkMenu
								mark={mark}
								onChange={(values) => {
									updateMarkAttrs(index, values);
								}}
								key={key}
							/>
						);
					}
					return (
						<MarkAttribute
							key={key}
							mark={mark}
							updateMarkAttr={(attrKey, val) => updateMarkAttr(index, attrKey, val)}
						/>
					);
				})}
				<DataAttributes nodeAttrs={nodeAttrs} updateData={updateData} />
			</div>

			<div
				style={{
					background: "#777",
					height: "1px",
					position: "absolute",
					left: position.left,
					top: position.top,
					right: position.right,
					transition: position.top === 0 ? "" : `right ${animationTimeMS}ms linear`,
				}}
			/>
		</>,
		containerRef.current
	);
}
