import type { Mark, Node } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";

import React, { useEffect, useMemo, useState } from "react";
import {
	useEditorEffect,
	useEditorEventCallback,
	useEditorState,
} from "@handlewithcare/react-prosemirror";

import { Input } from "ui/input";
import { Label } from "ui/label";

import { useEditorContext } from "./Context";

const animationTimeMS = 150;
const animationHeightMS = 100;

interface PanelProps {
	top: number;
	left: number;
	right: number | string;
	bottom: number;
}

const initPanelProps: PanelProps = {
	top: 0,
	left: 0,
	right: "100%",
	bottom: 0,
};

export function AttributePanel() {
	const [position, setPosition] = useState(initPanelProps);
	const state = useEditorState();
	const {
		activeNode,
		position: activeNodePosition,
		setActiveNode,
		setPosition: setActiveNodePosition,
	} = useEditorContext();

	useEditorEffect(() => {
		const node = state.selection.$from.nodeAfter;

		if (!node) {
			return;
		}

		// console.log({ node });
		// if (!node.text || !node.marks.length) {
		// 	setActiveNode(null);
		// 	return;
		// }

		setActiveNode(node);
		setActiveNodePosition(state.selection.$from.pos);
	}, [state]);

	useEditorEffect(
		(view) => {
			if (activeNode) {
				const coords = view.coordsAtPos(activeNodePosition);
				setPosition({
					...position,
					top: coords.top - 17,
					left: coords.left - 6,
					right: -250,
				});
				setTimeout(() => {
					setHeight(300);
				}, animationTimeMS);
			} else {
				setHeight(0);
			}
		},
		[activeNode, activeNodePosition]
	);

	const updateMarkAttr = useEditorEventCallback(
		(view, index: number, attrKey: string, value: string) => {
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
	});

	/* Set as init position and then keep track of state here, while syncing 
	so the panel doesn't become out of sync with doc (only an issue if values are shown
	and edited elsewhere */
	const [height, setHeight] = useState(0);
	// useEffect(() => {
	// 	if (panelPosition.top === 0) {
	// 		setPosition(panelPosition);
	// 		setHeight(0);
	// 	} else {
	// 		const newPosition = { ...position };
	// 		newPosition.top = panelPosition.top;
	// 		newPosition.left = panelPosition.left;
	// 		setPosition(newPosition);
	// 		setTimeout(() => {
	// 			setPosition({ ...panelPosition });
	// 		}, 0);
	// 		setTimeout(() => {
	// 			setHeight(300);
	// 		}, animationTimeMS);
	// 	}
	// }, [panelPosition]);
	const labelClass = "font-normal text-xs";
	const inputClass = "h-8 text-xs rounded-sm border-neutral-300";

	if (!activeNode) {
		return null;
	}
	const nodeAttrs = activeNode.attrs || {};
	const nodeMarks = activeNode.marks || [];

	if (Object.keys(nodeAttrs).length === 0 && nodeMarks.length === 0) {
		return null;
	}

	// Marks will automatically show names, so it is only the 'inline' types
	// that are not marks that need to be specifically rendered
	const showName = activeNode?.type?.name === "math_inline";

	return (
		<>
			<div
				className="z-20 drop-shadow-lg"
				style={{
					// borderTop: "1px solid #777",
					position: "absolute",
					background: "#fff",
					top: position.top,
					right: position.right,
					width: 300,
					padding: "1em",
					height: height,
					opacity: height ? 1 : 0,
					overflow: "scroll",
					borderLeft: "1px solid #999",
					borderRight: "1px solid #999",
					borderBottom: `${height ? 1 : 0}px solid #999`,
					borderRadius: "0px 0px 4px 4px",
					transition:
						position.top === 0
							? ""
							: `height ${animationHeightMS}ms linear, opacity ${animationHeightMS}ms linear `,
				}}
			>
				<div className="text-sm">Attributes</div>
				{showName ? (
					<div className="mt-4 text-sm font-bold">{activeNode.type?.name}</div>
				) : null}
				{Object.keys(nodeAttrs).map((attrKey) => {
					if (attrKey === "data") {
						return null;
					}
					return (
						<div key={attrKey}>
							<Label className={labelClass}>{attrKey}</Label>
							<Input
								className={inputClass}
								type="text"
								defaultValue={nodeAttrs[attrKey] || ""}
								onChange={(evt) => {
									updateAttr(attrKey, evt.target.value);
								}}
							/>
						</div>
					);
				})}
				{!!nodeMarks.length &&
					nodeMarks.map((mark, index) => {
						return (
							<div key={mark.type.name}>
								<div className="mt-4 text-sm font-bold">{mark.type.name}</div>
								{Object.keys(mark.attrs).map((attrKey) => {
									if (attrKey === "data") {
										return null;
									}
									return (
										<div key={attrKey}>
											<Label className={labelClass}>{attrKey}</Label>
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
											/>
										</div>
									);
								})}
							</div>
						);
					})}

				{nodeAttrs.data && (
					<>
						<div className="mt-8 text-sm">Data</div>
						{Object.keys(nodeAttrs.data).map((attrKey) => {
							return (
								<div key={attrKey}>
									<Label className={labelClass}>{attrKey}</Label>
									<Input
										className={inputClass}
										type="text"
										value={nodeAttrs.data[attrKey] || ""}
										onChange={(evt) => {
											updateData(attrKey, evt.target.value);
										}}
									/>
								</div>
							);
						})}
					</>
				)}
			</div>

			<div
				className="z-20"
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
		</>
	);
}
