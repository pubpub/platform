import { widget } from "@handlewithcare/react-prosemirror"
import { Plugin } from "prosemirror-state"
import { type Decoration, DecorationSet } from "prosemirror-view"

import { BlockDecoration, InlineDecoration } from "../components/StructureDecoration"

export default function structureDecorationsPlugin() {
	return new Plugin({
		props: {
			decorations: (state) => {
				const counts = new Map<string, number>()
				const decorations: Decoration[] = []
				state.doc.descendants((node, pos) => {
					let nodeIsDescendantOfTable = false
					state.doc.nodesBetween(pos, pos, (node) => {
						if (
							node.type.name === "table" ||
							node.type.name === "table_row" ||
							node.type.name === "table_cell" ||
							node.type.name === "table_header"
						) {
							nodeIsDescendantOfTable = true
						}
					})
					if (nodeIsDescendantOfTable) {
						return
					}
					const count = counts.get(node.type.name) || 0
					counts.set(node.type.name, count + 1)
					if (node.type.isBlock) {
						// TODO: is there a better key we can use?
						decorations.push(
							widget(pos, BlockDecoration, {
								key: `node-${node.type.name}-${count}`,
								side: -1,
							})
						)
					}
					const isInline = !node.type.isBlock
					const hasMarks = !!node.marks.length
					const isMath = node.type.name === "math_inline"
					if (isInline && (hasMarks || isMath)) {
						/* If it's an inline node with marks OR is inline math */
						decorations.push(
							widget(pos, InlineDecoration, {
								key: `mark-${node.type.name}-${count}`,
							})
						)
					}
				})
				return DecorationSet.create(state.doc, decorations)
			},
		},
	})
}
