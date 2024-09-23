import React, { useEffect, useRef, useState } from "react";
import { EditorView } from "prosemirror-view";

import { Input } from "ui/input";
import { Label } from "ui/label";

import { PanelProps } from "../ContextEditor";

const animationTimeMS = 150;
const animationHeightMS = 100;

export interface AttributePanelProps {
	panelPosition: PanelProps;
	viewRef: React.MutableRefObject<EditorView | null>;
}

export function AttributePanel({ panelPosition, viewRef }: AttributePanelProps) {
	const [position, setPosition] = useState(panelPosition);
	/* Set as init position and then keep track of state here, while syncing 
	so the panel doesn't become out of sync with doc (only an issue if values are shown
	and edited elsewhere */
	const [height, setHeight] = useState(0);
	useEffect(() => {
		if (panelPosition.top === 0) {
			setPosition(panelPosition);
			setHeight(0);
		} else {
			const newPosition = { ...position };
			newPosition.top = panelPosition.top;
			newPosition.left = panelPosition.left;
			setPosition(newPosition);
			setTimeout(() => {
				setPosition({ ...panelPosition });
			}, 0);
			setTimeout(() => {
				setHeight(300);
			}, animationTimeMS);
		}
	}, [panelPosition]);
	const labelClass = "font-normal text-xs";
	const inputClass = "h-8 text-xs rounded-sm border-neutral-300";
	const node = position.node;
	// if (!node) {
	// 	return null;
	// }
	const updateAttr = (attrKey, value) => {
		setPosition({
			...position,
			node: {
				...node,
				attrs: { ...node.attrs, [attrKey]: value },
			},
		});
		viewRef.current?.dispatch(
			viewRef.current.state.tr.setNodeMarkup(
				panelPosition.pos,
				node.type,
				{ ...node.attrs, [attrKey]: value },
				node.marks
			)
		);
	};
	const updateMarkAttr = (index, attrKey, value) => {
		console.log(node);
		const markToReplace = node.marks[index];
		// const newMarks = [...node.marks];
		// newMarks[index].attrs[attrKey] = value;
		// setPosition({
		// 	...position,
		// 	node: {
		// 		...node,
		// 		marks: newMarks
		// 	},
		// });
		const newMark = viewRef.current?.state.schema.marks[markToReplace.type.name].create({
			...markToReplace.attrs,
			[attrKey]: value,
		});

		viewRef.current?.dispatch(
			viewRef.current.state.tr.addMark(
				panelPosition.pos,
				panelPosition.pos + node.nodeSize,
				newMark
			)
		);
	};
	const updateData = (attrKey, value) => {
		setPosition({
			...position,
			node: {
				...node,
				attrs: { ...node.attrs, data: { ...node.attrs.data, [attrKey]: value } },
			},
		});
		viewRef.current?.dispatch(
			viewRef.current.state.tr.setNodeMarkup(
				panelPosition.pos,
				node.type,
				{ ...node.attrs, data: { ...node.attrs.data, [attrKey]: value } },
				node.marks
			)
		);
	};
	return (
		<>
			{node && (
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
							panelPosition.top === 0
								? ""
								: `height ${animationHeightMS}ms linear, opacity ${animationHeightMS}ms linear `,
					}}
				>
					<div className="text-sm">Attributes</div>
					{Object.keys(node.attrs).map((attrKey) => {
						if (attrKey === "data") {
							return null;
						}
						return (
							<div key={attrKey}>
								<Label className={labelClass}>{attrKey}</Label>
								<Input
									className={inputClass}
									type="text"
									value={node.attrs[attrKey] || ""}
									onChange={(evt) => {
										updateAttr(attrKey, evt.target.value);
									}}
								/>
							</div>
						);
					})}
					{!!node.marks.length &&
						node.marks.map((mark, index) => {
							return (
								<div>
									<div className="text-sm font-bold mt-4">{mark.type.name}</div>
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

					{node.attrs.data && (
						<>
							<div className="mt-8 text-sm">Data</div>
							{Object.keys(node.attrs.data).map((attrKey) => {
								return (
									<div key={attrKey}>
										<Label className={labelClass}>{attrKey}</Label>
										<Input
											className={inputClass}
											type="text"
											value={node.attrs.data[attrKey] || ""}
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
			)}
			<div
				className="z-20"
				style={{
					background: "#777",
					height: "1px",
					position: "absolute",
					left: position.left,
					top: position.top,
					right: position.right,
					transition: panelPosition.top === 0 ? "" : `right ${animationTimeMS}ms linear`,
				}}
			/>
		</>
	);
}
