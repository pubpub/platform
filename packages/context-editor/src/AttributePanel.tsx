import React, { useEffect, useRef, useState } from "react";

const animationTimeMS = 150;
const animationHeightMS = 100;
export function AttributePanel({ panelPosition }) {
	const [position, setPosition] = useState(panelPosition);
	const [height, setHeight] = useState(0);
	useEffect(() => {
		console.log(position, panelPosition);
		if (panelPosition[0] === 0) {
			console.log("u");
			setPosition(panelPosition);
			setHeight(0);
		} else {
			const newPosition = position;
			newPosition[0] = panelPosition[0];
			newPosition[2] = panelPosition[2];
			console.log("ya", newPosition);
			setPosition(newPosition);
			setTimeout(() => {
				setPosition(panelPosition);
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
					background: "white",
					top: position[0],
					right: position[1],
					width: 150,
					height: height,
					opacity: height ? 1 : 0,
					overflow: "scroll",
					borderLeft: "1px solid #777",
					borderRight: "1px solid #777",
					borderBottom: `${height ? 1 : 0}px solid #777`,
					transition:
						panelPosition[0] === 0
							? ""
							: `height ${animationHeightMS}ms linear, opacity ${animationHeightMS}ms linear `,
				}}
			>
				{panelPosition}
			</div>
			<div
				style={{
					background: "#777",
					height: "1px",
					position: "absolute",
					left: position[2],
					top: position[0],
					right: position[1],
					transition: panelPosition[0] === 0 ? "" : `right ${animationTimeMS}ms linear`,
				}}
			/>
		</>
	);
}
