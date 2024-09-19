import React, { useEffect, useReducer, useState } from "react";

import { Card, CardContent } from "ui/card";

import { SuggestProps } from "../ContextEditor";

export default function SuggestPanel({ isOpen, selectedIndex, items, filter }: SuggestProps) {
	const [position, setPosition] = useState([0, 0]);
	useEffect(() => {
		const span = document.getElementsByClassName("autocomplete")[0];
		if (span) {
			const rect = span.getBoundingClientRect();
			setPosition([rect.top, rect.left]);
			console.log("just set it");
		}
	}, [isOpen, filter]);
	if (!isOpen) {
		return null;
	}
	console.log(items);
	return (
		<div
			className=""
			style={{
				background: "white",
				border: "1px solid #777",
				position: "absolute",
				top: position[0],
				left: position[1],
			}}
		>
			{items.map((item, index) => {
				const itemIsPub = item.pubTypeId;
				const itemIsField = item.schemaName;
				return (
					<div className={index === selectedIndex ? 'bg-neutral-400' : ''}>
						{itemIsPub && <div>{item.values["rd:title"]}</div>}
						{itemIsField && <div>Insert {item.name}</div>}
						{!itemIsPub && !itemIsField && <div>Create and Insert {item.name}</div>}
					</div>
				);
			})}
		</div>
	);
}
