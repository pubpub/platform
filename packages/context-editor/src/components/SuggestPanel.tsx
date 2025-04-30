import React, { useEffect, useState } from "react";
import { useEditorEffect } from "@handlewithcare/react-prosemirror";
import { RectangleEllipsis, StickyNote, ToyBrick } from "lucide-react";

import type { SuggestProps } from "../ContextEditor";
import { reactPropsKey } from "../plugins/reactProps";

type Props = {
	suggestData: SuggestProps;
	setSuggestData: any;
	containerRef: React.RefObject<HTMLDivElement | null>;
};
export default function SuggestPanel({ suggestData, setSuggestData, containerRef }: Props) {
	const { isOpen, selectedIndex, items, filter } = suggestData;
	const [position, setPosition] = useState([0, 0]);

	/**
	 * In order to get the suggestions to the plugin, we pass props through
	 * reactPropsKey which the plugin can then access.
	 */
	useEditorEffect(
		(view) => {
			if (!view) return;
			const reactPropsOld = reactPropsKey.getState(view.state);
			const tr = view.state.tr.setMeta(reactPropsKey, {
				...reactPropsOld,
				suggestData,
				setSuggestData,
			});
			view.dispatch(tr);
		},
		[suggestData]
	);

	useEffect(() => {
		const span = document.getElementsByClassName("autocomplete")[0];
		if (span) {
			const rect = span.getBoundingClientRect();
			const container = containerRef.current;
			if (container) {
				const containerBound = container.getBoundingClientRect();
				const topOffset = -1 * containerBound.top + container.scrollTop + 16;
				const leftOffset = -1 * containerBound.left + 16;
				setPosition([rect.top + 20 + topOffset, rect.left + leftOffset]);
			}
		}
	}, [isOpen, filter, containerRef]);
	if (!isOpen) {
		return null;
	}
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
						key={item.id}
						className={`rounded p-1 ${index === selectedIndex ? "bg-neutral-200" : ""}`}
						data-testid="suggest-item"
					>
						{itemIsPub && (
							<div className="flex items-center space-x-2">
								<StickyNote className="flex-shrink-0" size={16} />{" "}
								<span className="truncate">
									Insert <span className="italic">{item.values["rd:title"]}</span>
								</span>
							</div>
						)}
						{itemIsField && (
							<div className="flex items-center space-x-2">
								<RectangleEllipsis className="flex-shrink-0" size={16} />{" "}
								<span className="truncate">
									Insert{" "}
									<span className="rounded-md bg-neutral-200/80 p-1 font-mono">
										{item.name}
									</span>
								</span>
							</div>
						)}
						{!itemIsPub && !itemIsField && (
							<div className="flex items-center space-x-2">
								<ToyBrick className="flex-shrink-0" size={16} />{" "}
								<span className="truncate">
									Insert new <span>{item.name}</span>
								</span>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
