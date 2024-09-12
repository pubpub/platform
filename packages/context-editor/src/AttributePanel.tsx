import React, { useEffect, useRef, useState } from "react";

const animationTimeMS = 150;
const animationHeightMS = 100;
export function AttributePanel({ panelPosition, viewRef }) {
	const [position, setPosition] = useState(panelPosition);
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
					borderLeft: "1px solid #777",
					borderRight: "1px solid #777",
					borderBottom: `${height ? 1 : 0}px solid #777`,
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
						// console.log(evt.target.value, node, viewRef.current.dispatch, viewRef.current.state);
						viewRef.current.dispatch(
							viewRef.current.state.tr.setNodeMarkup(
								panelPosition.pos,
								node.type,
								{ level: evt.target.value },
								node.marks
							)
						);
						// updateFunc.func({level: evt.target.value});
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
