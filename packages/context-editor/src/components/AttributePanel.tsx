import React, { useState } from "react";
import {
	useEditorEffect,
	useEditorEventCallback,
	useEditorState,
} from "@handlewithcare/react-prosemirror";
import { createPortal } from "react-dom";

import { Input } from "ui/input";
import { Label } from "ui/label";

import { replaceMark } from "../commands/marks";
import { useEditorContext } from "./Context";
import { MENU_BAR_HEIGHT } from "./MenuBar";
import { DataAttributes } from "./menus/DefaultAttributesMenu";
import { LinkMenu } from "./menus/LinkMenu";
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
	const { position, setPosition } = useEditorContext();
	const node = position === null ? null : state.doc.nodeAt(position);

	useEditorEffect(() => {
		const p = state.selection.$from;
		if (p.marks().length > 0) {
			setPosition(p.pos);
		}
	}, [state]);

	useEditorEffect(
		(view) => {
			if (position === null) {
				setOffset({ ...offset, right: 1000 });
				return;
			}

			const node = state.doc.nodeAt(position);

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
		[state, position]
	);

	useEditorEffect(
		(view) => {
			if (position === null) {
				setHeight(0);
				return;
			}
			const node = state.doc.nodeAt(position);
			if (node) {
				const viewClientRect = view.dom.getBoundingClientRect();
				const coords = view.coordsAtPos(position);
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
		[position, containerRef]
	);

	const updateMarkAttr = useEditorEventCallback(
		(view, index: number, attrKey: string, value: string | null) => {
			if (!view || !position) return;

			const mark = nodeMarks[index];
			const markAttrs = {
				...mark.attrs,
				[attrKey]: value,
			};

			replaceMark(position, mark, markAttrs)(view.state, view.dispatch);
		}
	);

	/** Bulk update version of updateMarkAttr */
	const updateMarkAttrs = useEditorEventCallback(
		(view, index: number, attrs: Record<string, string | null>) => {
			if (!view || !position) return;

			const mark = nodeMarks[index];
			const markAttrs = {
				...mark.attrs,
				...attrs,
			};

			replaceMark(position, mark, markAttrs)(view.state, view.dispatch);
		}
	);

	const updateData = useEditorEventCallback((view, attrKey: string, value: string) => {
		if (!view || !node || !position) return;
		view.dispatch(
			view.state.tr.setNodeMarkup(
				position,
				node.type,
				{ ...node.attrs, data: { ...nodeAttrs.data, [attrKey]: value } },
				node.marks
			)
		);
	});

	const updateNodeAttrs = useEditorEventCallback((view, attrs: Record<string, unknown>) => {
		if (!view || !node || !position) return;
		const tr = view.state.tr.setNodeMarkup(
			position,
			node.type,
			{ ...node.attrs, ...attrs },
			node.marks
		);
		view.dispatch(tr);
	});

	if (!node) {
		return null;
	}

	const labelClass = "font-normal text-xs";
	const inputClass = "h-8 text-xs rounded-sm border-neutral-300";

	const nodeAttrs = node.attrs || {};
	const nodeMarks = node.marks || [];

	// Marks will automatically show names, so it is only the 'inline' types
	// that are not marks that need to be specifically rendered
	const showName = node?.type?.name === "math_inline";

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
					top: offset.top,
					left: offset.panelLeft,
					width: 300,
					padding: "1em",
					height: "auto",
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
				}}
				data-testid="attribute-panel"
			>
				<div className="text-sm">Attributes</div>
				{showName ? <div className="mt-4 text-sm font-bold">{node.type?.name}</div> : null}
				{nodeMarks.length > 0 ? (
					nodeMarks.map((mark, index) => {
						const key = `${mark.type.name}-${position}`;
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
							<div key={key}>
								<div className="mt-4 text-sm font-bold">{mark.type.name}</div>
								{Object.keys(mark.attrs).map((attrKey) => {
									if (attrKey === "data") {
										return null;
									}
									const key = `${mark.type.name}-${attrKey}`;
									return (
										<div key={key}>
											<Label className={labelClass} htmlFor={key}>
												{attrKey}
											</Label>
											<Input
												className={inputClass}
												type="text"
												defaultValue={mark.attrs[attrKey] || ""}
												onChange={(evt) => {
													updateMarkAttr(
														index,
														attrKey,
														evt.target.value
													);
												}}
												id={key}
											/>
										</div>
									);
								})}
							</div>
						);
					})
				) : (
					<NodeMenu node={node} onChange={updateNodeAttrs} />
				)}
				<DataAttributes nodeAttrs={nodeAttrs} updateData={updateData} />
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
