import React, { useEffect, useReducer, useState } from "react";
import { RectangleEllipsis, StickyNote, ToyBrick } from "lucide-react";

import { Card, CardContent } from "ui/card";

import { SuggestProps } from "../ContextEditor";

export default function SuggestPanel({ isOpen, selectedIndex, items, filter }: SuggestProps) {
	const [position, setPosition] = useState([0, 0]);
	useEffect(() => {
		const span = document.getElementsByClassName("autocomplete")[0];
		if (span) {
			const rect = span.getBoundingClientRect();
			const container = document.getElementById("context-editor-container");
			const topOffset = -1 * container.getBoundingClientRect().top + container.scrollTop + 16;
			setPosition([rect.top + 20 + topOffset, rect.left]);
			// console.log("just set it");
		}
	}, [isOpen, filter]);
	if (!isOpen) {
		return null;
	}
	// console.log(items);
	return (
		<div
			className="w-80 p-2"
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
					<div
						className={`rounded p-1 ${index === selectedIndex ? "bg-neutral-200" : ""}`}
					>
						{itemIsPub && (
							<div className="flex items-center space-x-2">
								<StickyNote size={16} /> <span className="truncate">Insert <span className="italic">{item.values["rd:title"]}</span></span>
							</div>
						)}
						{itemIsField && (
							<div className="flex items-center space-x-2">
								<RectangleEllipsis size={16} /> <span className="truncate">Insert <span className="font-mono bg-neutral-200/80 rounded-md p-1">{item.name}</span></span>
							</div>
						)}
						{!itemIsPub && !itemIsField && (
							<div className="flex items-center space-x-2">
								<ToyBrick size={16} /> <span className="truncate">Insert new <span>{item.name}</span></span>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
