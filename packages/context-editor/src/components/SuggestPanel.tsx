import type { SuggestProps } from "../ContextEditor"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useEditorEffect } from "@handlewithcare/react-prosemirror"
import { RectangleEllipsis, StickyNote, ToyBrick } from "lucide-react"

import { reactPropsKey } from "../plugins/reactProps"
import { MENU_BAR_HEIGHT } from "./MenuBar"

type Props = {
	suggestData: SuggestProps
	setSuggestData: React.Dispatch<React.SetStateAction<SuggestProps>>
	containerRef: React.RefObject<HTMLDivElement | null>
}
export default function SuggestPanel({ suggestData, setSuggestData, containerRef }: Props) {
	const { isOpen, selectedIndex, items, filter } = suggestData
	const [position, setPosition] = useState([0, 0])

	/**
	 * In order to get the suggestions to the plugin, we pass props through
	 * reactPropsKey which the plugin can then access.
	 */
	useEditorEffect(
		(view) => {
			if (!view) return
			const reactPropsOld = reactPropsKey.getState(view.state)
			const tr = view.state.tr.setMeta(reactPropsKey, {
				...reactPropsOld,
				suggestData,
				setSuggestData,
			})
			view.dispatch(tr)
		},
		[suggestData]
	)

	// just terrible way to do this
	useEffect(() => {
		const span = document.getElementsByClassName("autocomplete")[0]
		if (span) {
			const rect = span.getBoundingClientRect()
			const container = containerRef.current
			if (container) {
				const containerBound = container.getBoundingClientRect()
				const topOffset = containerBound.top - MENU_BAR_HEIGHT + container.scrollTop
				const leftOffset = containerBound.left + 16
				setPosition([rect.top + 20 + topOffset, rect.left + leftOffset])
			}
		}
	}, [containerRef.current, suggestData.isOpen])

	const [top, left] = position

	const style = useMemo(
		() => ({
			top: window.innerHeight - top,
			left: window.innerWidth - left,
		}),
		[top, left]
	)

	if (!isOpen) {
		return null
	}

	const content = (
		<div className="absolute w-80 rounded-xl border bg-card p-2" style={style}>
			{items.map((item, index) => {
				const itemIsPub = item.pubTypeId
				const itemIsField = item.schemaName
				return (
					<div
						key={item.id}
						className={`rounded-xs p-1 ${index === selectedIndex ? "bg-muted" : ""}`}
						data-testid="suggest-item"
					>
						{itemIsPub && (
							<div className="flex items-center space-x-2">
								<StickyNote className="shrink-0" size={16} />{" "}
								<span className="truncate">
									Insert <span className="italic">{item.title}</span>
								</span>
							</div>
						)}
						{itemIsField && (
							<div className="flex items-center space-x-2">
								<RectangleEllipsis className="shrink-0" size={16} />{" "}
								<span className="truncate">
									Insert{" "}
									<span className="rounded-md bg-muted/80 p-1 font-mono">
										{item.name}
									</span>
								</span>
							</div>
						)}
						{!itemIsPub && !itemIsField && (
							<div className="flex items-center space-x-2">
								<ToyBrick className="shrink-0" size={16} />{" "}
								<span className="truncate">
									Insert new <span>{item.name}</span>
								</span>
							</div>
						)}
					</div>
				)
			})}
		</div>
	)

	return createPortal(content, window.document.body)
}
