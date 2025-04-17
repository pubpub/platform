import type { Mark } from "prosemirror-model";

import React from "react";
import { usePluginViewContext } from "@prosemirror-adapter/react";
import { useDebouncedCallback } from "use-debounce";

import { Input } from "ui/input";
import { Label } from "ui/label";

import { attributePanelKey } from "../plugins/attributePanel";
import { baseSchema } from "../schemas";
import { InlineLinkMenu } from "./InlineLinkMenu";

const animationTimeMS = 150;
const animationHeightMS = 100;

export function AttributePanel() {
	const { view } = usePluginViewContext();

	const attributePanelPluginState = attributePanelKey.getState(view.state);
	if (!attributePanelPluginState) {
		return null;
	}
	const { panelPosition: panelProps, setPanelPosition: setPanelProps } =
		attributePanelPluginState;

	const labelClass = "font-normal text-xs";
	const inputClass = "h-8 text-xs rounded-sm border-neutral-300";
	const { node, isOpen } = panelProps;

	const isLink = node?.marks && Boolean(baseSchema.marks.link.isInSet(node.marks));

	if (!node || !isOpen) {
		return null;
	}
	const nodeAttrs = node.attrs || {};
	const nodeMarks = node.marks || [];
	const updateAttr = (attrKey: string, value: string) => {
		setPanelProps({
			...panelProps,
			node: {
				...node,
				attrs: { ...node.attrs, [attrKey]: value },
			},
		});
		view.dispatch(
			view.state.tr.setNodeMarkup(
				panelProps.pos,
				node.type,
				{ ...node.attrs, [attrKey]: value },
				node.marks
			)
		);
	};
	const updateMarkAttr = (mark: Mark, attrKey: string, value: string) => {
		const oldMarks = node.marks || [];
		const oldMark = oldMarks.find((m) => m.type === mark.type);
		const newMark = view.state.schema.marks[mark.type.name].create({
			...mark.attrs,
			...oldMark?.attrs,
			[attrKey]: value,
		});

		if (!newMark) {
			return null;
		}
		setPanelProps({
			...panelProps,
			node: {
				...node,
				marks: [...oldMarks.filter((m) => m.type !== mark.type), newMark],
			},
		});

		//TODO: do we need to delete the mark first?
		view.dispatch(
			view.state.tr.addMark(panelProps.pos, panelProps.pos + (node.nodeSize || 0), newMark)
		);
	};
	const updateData = (attrKey: string, value: string) => {
		setPanelProps({
			...panelProps,
			node: {
				...node,
				attrs: { ...nodeAttrs, data: { ...nodeAttrs.data, [attrKey]: value } },
			},
		});
		view.dispatch(
			view.state.tr.setNodeMarkup(
				panelProps.pos,
				node.type,
				{ ...node.attrs, data: { ...nodeAttrs.data, [attrKey]: value } },
				node.marks
			)
		);
	};
	// Marks will automatically show names, so it is only the 'inline' types
	// that are not marks that need to be specifically rendered
	const showName = node.type?.name === "math_inline";

	const attrInputs = Object.keys(nodeAttrs).map((attrKey) => {
		if (attrKey === "data") {
			return null;
		}
		return (
			<div key={attrKey}>
				<Label className={labelClass}>{attrKey}</Label>
				<Input
					className={inputClass}
					type="text"
					value={nodeAttrs[attrKey] || ""}
					onChange={useDebouncedCallback((evt) => {
						updateAttr(attrKey, evt.target.value);
					}, 200)}
				/>
			</div>
		);
	});
	const coords = view.coordsAtPos(panelProps.pos, -1);
	const container = document.getElementById("context-editor-container");
	let topOffset = 0;
	let leftOffset = 0;
	if (container) {
		const containerRect = container.getBoundingClientRect();
		topOffset = -1 * containerRect.top + container.scrollTop;
		leftOffset = -1 * containerRect.left + container.scrollLeft;
		console.log({ topOffset, leftOffset, containerRect, coords });
	}

	if (node.isBlock) {
		topOffset += 30;
	}

	return (
		<>
			{node && (
				<div
					className="z-20 w-[300px] rounded-md border border-gray-200 bg-white px-4 py-2"
					style={{
						position: "absolute",
						top: coords.bottom + topOffset,
						left: coords.left + leftOffset,
						transition:
							panelProps.top === 0
								? ""
								: `height ${animationHeightMS}ms linear, opacity ${animationHeightMS}ms linear `,
					}}
				>
					{isLink ? (
						<InlineLinkMenu panelProps={panelProps}>{attrInputs}</InlineLinkMenu>
					) : (
						<>
							<div className="text-sm">Attributes</div>
							{showName ? (
								<div className="mt-4 text-sm font-bold">{node.type?.name}</div>
							) : null}
							{attrInputs}
							{!!nodeMarks.length &&
								nodeMarks.map((mark, index) => {
									return (
										<div key={mark.type.name}>
											<div className="mt-4 text-sm font-bold">
												{mark.type.name}
											</div>
											{Object.keys(mark.attrs).map((attrKey) => {
												if (attrKey === "data") {
													return null;
												}
												return (
													<div key={attrKey}>
														<Label className={labelClass}>
															{attrKey}
														</Label>
														<Input
															className={inputClass}
															type="text"
															defaultValue={mark.attrs[attrKey] || ""}
															onChange={useDebouncedCallback(
																(evt) => {
																	updateMarkAttr(
																		nodeMarks[index],
																		attrKey,
																		evt.target.value
																	);
																},
																200
															)}
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
													onChange={useDebouncedCallback((evt) => {
														updateData(attrKey, evt.target.value);
													}, 200)}
												/>
											</div>
										);
									})}
								</>
							)}
						</>
					)}
				</div>
			)}
		</>
	);
}
