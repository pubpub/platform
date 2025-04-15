import type { Mark } from "prosemirror-model";

import React, { useEffect, useState } from "react";
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
	const [height, setHeight] = useState(0);
	const state = useEditorState();
	const {
		activeNode,
		position: activeNodePosition,
		setActiveNode,
		setPosition: setActiveNodePosition,
	} = useEditorContext();

	console.log({ activeNode });

	/**
	 * This determination of the 'activeNode' is prone to bugs. We should figure
	 * out a better way to do it.
	 **/
	useEffect(() => {
		const node = state.selection.$from.nodeAfter;

		if (!node) {
			return;
		}

		setActiveNode(node);
		setActiveNodePosition(state.selection.$from.pos);
	}, [state]);

	useEditorEffect(
		(view) => {
			if (activeNode) {
				const viewClientRect = view.dom.getBoundingClientRect();
				const coords = view.coordsAtPos(activeNodePosition);
				setPosition({
					...position,
					top: coords.top - 1 - viewClientRect.top,
					left: coords.left - viewClientRect.left,
					right: -275,
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
