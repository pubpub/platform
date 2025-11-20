import type { DragEndEvent } from "@dnd-kit/core"

import mudder from "mudder"

export const findRanksBetween = ({ start = "", end = "", numberOfRanks = 1 }) =>
	mudder.base62.mudder(start, end, numberOfRanks)

export const getRankAndIndexChanges = <T extends { rank: string }[]>(
	event: DragEndEvent,
	elements: T
) => {
	const { active, over } = event
	if (over && active.id !== over?.id) {
		// activeIndex is the position the element started at and over is where it was
		// dropped
		const activeIndex = active.data.current?.sortable?.index
		const overIndex = over.data.current?.sortable?.index
		if (activeIndex !== undefined && overIndex !== undefined) {
			// "earlier" means towards the beginning of the list, or towards the top of the page
			const isMovedEarlier = activeIndex > overIndex

			// When moving an element earlier in the array, find a rank between the rank of the
			// element at the dropped position and the element before it. When moving an element
			// later, instead find a rank between that element and the element after it
			const aboveRank = elements[isMovedEarlier ? overIndex : overIndex + 1]?.rank ?? ""
			const belowRank = elements[isMovedEarlier ? overIndex - 1 : overIndex]?.rank ?? ""
			const [rank] = findRanksBetween({ start: belowRank, end: aboveRank })

			return {
				activeIndex,
				overIndex,
				rank,
			}
		}
	}
}
