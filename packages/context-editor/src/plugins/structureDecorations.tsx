import React from "react";
import { widget } from "@handlewithcare/react-prosemirror";
import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

import { BlockDecoration, InlineDecoration } from "../components/StructureDecoration";

export default () => {
	return new Plugin({
		props: {
			decorations: (state) => {
				const decorations: Decoration[] = [];
				state.doc.descendants((node, pos) => {
					if (
						node.type.name === "table_row" ||
						node.type.name === "table_cell" ||
						node.type.name === "table_header"
					) {
						// Don't add decorations to table rows or cells
						return;
					}
					if (node.type.isBlock) {
						// TODO: is there a better key we can use?
						decorations.push(
							widget(pos, BlockDecoration, { key: `node-${pos}`, side: -1 })
						);
					}
					const isInline = !node.type.isBlock;
					const hasMarks = !!node.marks.length;
					const isMath = node.type.name === "math_inline";
					if (isInline && (hasMarks || isMath)) {
						/* If it's an inline node with marks OR is inline math */
						decorations.push(widget(pos, InlineDecoration, { key: `mark-${pos}` }));
					}
				});
				return DecorationSet.create(state.doc, decorations);
			},
		},
	});
};
