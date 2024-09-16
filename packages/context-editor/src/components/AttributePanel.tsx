import React, { useEffect, useRef, useState } from "react";
import { EditorView } from "prosemirror-view";

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
				setHeight(250);
			}, animationTimeMS);
		}
	}, [panelPosition]);

	return (
		<>
			<div
				style={{
					// borderTop: "1px solid #777",
					position: "absolute",
					background: "#f7f7f7",
					top: position.top,
					right: position.right,
					width: 250,
					padding: "1em",
					height: height,
					opacity: height ? 1 : 0,
					overflow: "scroll",
					borderLeft: "1px solid #999",
					borderRight: "1px solid #999",
					borderBottom: `${height ? 1 : 0}px solid #999`,
					borderRadius: "0px 0px 2px 2px",
					transition:
						panelPosition.top === 0
							? ""
							: `height ${animationHeightMS}ms linear, opacity ${animationHeightMS}ms linear `,
				}}
			>
				{panelPosition.top}
				<hr />
				<input
					onChange={(evt) => {
						const node = panelPosition.node;
						if (node) {
							viewRef.current?.dispatch(
								viewRef.current.state.tr.setNodeMarkup(
									panelPosition.pos,
									node.type,
									{ ...node.attrs, level: evt.target.value },
									node.marks
								)
							);
						}
					}}
				/>
				<hr />
				{JSON.stringify(panelPosition.node?.attrs, null, 2)}
			</div>
			<div
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
