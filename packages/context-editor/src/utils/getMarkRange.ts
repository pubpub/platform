// getMarkRange and supporting functions taken from tiptap
// https://github.com/ueberdosis/tiptap/blob/f3258d9ee5fb7979102fe63434f6ea4120507311/packages/core/src/helpers/getMarkRange.ts

import type { Mark, MarkType, ResolvedPos } from "prosemirror-model"

function isRegExp(value: any): value is RegExp {
	return Object.prototype.toString.call(value) === "[object RegExp]"
}

function objectIncludes(
	object1: Record<string, any>,
	object2: Record<string, any>,
	options: { strict: boolean } = { strict: true }
): boolean {
	const keys = Object.keys(object2)

	if (!keys.length) {
		return true
	}

	return keys.every((key) => {
		if (options.strict) {
			return object2[key] === object1[key]
		}

		if (isRegExp(object2[key])) {
			return object2[key].test(object1[key])
		}

		return object2[key] === object1[key]
	})
}

function findMarkInSet(
	marks: Mark[],
	type: MarkType,
	attributes: Record<string, any> = {}
): Mark | undefined {
	return marks.find((item) => {
		return (
			item.type === type &&
			objectIncludes(
				// Only check equality for the attributes that are provided
				Object.fromEntries(Object.keys(attributes).map((k) => [k, item.attrs[k]])),
				attributes
			)
		)
	})
}

export function isMarkInSet(
	marks: Mark[],
	type: MarkType,
	attributes: Record<string, any> = {}
): boolean {
	return !!findMarkInSet(marks, type, attributes)
}

/**
 * Get the range of a mark at a resolved position.
 */
export function getMarkRange(
	/**
	 * The position to get the mark range for.
	 */
	$pos: ResolvedPos,
	/**
	 * The mark type to get the range for.
	 */
	type: MarkType,
	/**
	 * The attributes to match against.
	 * If not provided, only the first mark at the position will be matched.
	 */
	attributes?: Record<string, any>
): { from: number; to: number } | undefined {
	if (!$pos || !type) {
		return
	}
	let start = $pos.parent.childAfter($pos.parentOffset)

	// If the cursor is at the start of a text node that does not have the mark, look backward
	if (!start.node || !start.node.marks.some((mark) => mark.type === type)) {
		start = $pos.parent.childBefore($pos.parentOffset)
	}

	// If there is no text node with the mark even backward, return undefined
	if (!start.node || !start.node.marks.some((mark) => mark.type === type)) {
		return
	}

	// Default to only matching against the first mark's attributes
	attributes = attributes || start.node.marks[0]?.attrs

	// We now know that the cursor is either at the start, middle or end of a text node with the specified mark
	// so we can look it up on the targeted mark
	const mark = findMarkInSet([...start.node.marks], type, attributes)

	if (!mark) {
		return
	}

	let startIndex = start.index
	let startPos = $pos.start() + start.offset
	let endIndex = startIndex + 1
	let endPos = startPos + start.node.nodeSize

	while (
		startIndex > 0 &&
		isMarkInSet([...$pos.parent.child(startIndex - 1).marks], type, attributes)
	) {
		startIndex -= 1
		startPos -= $pos.parent.child(startIndex).nodeSize
	}

	while (
		endIndex < $pos.parent.childCount &&
		isMarkInSet([...$pos.parent.child(endIndex).marks], type, attributes)
	) {
		endPos += $pos.parent.child(endIndex).nodeSize
		endIndex += 1
	}

	return {
		from: startPos,
		to: endPos,
	}
}
