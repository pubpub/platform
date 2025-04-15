import React from "react";
import { widget } from "@handlewithcare/react-prosemirror";
import { Node } from "prosemirror-model";
import { EditorState, Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

import { BlockDecoration } from "../components/StructureDecoration";
import { reactPropsKey } from "./reactProps";

export default () => {
	return new Plugin({
		props: {
			decorations: (state) => {
				const decorations: Decoration[] = [];
				// const { setPanelPosition } = attributePanelKey.getState(state);
				state.doc.descendants((node, pos) => {
					if (node.type.isBlock) {
						decorations.push(widget(pos, BlockDecoration, { key: `node-${pos}` }));
						// decorations.push(Decoration.widget(pos, wrapWidget(state, node, pos)));
					}
					// const isInline = !node.type.isBlock;
					// const hasMarks = !!node.marks.length;
					// const isMath = node.type.name === "math_inline";
					// if (isInline && (hasMarks || isMath)) {
					// 	/* If it's an inline node with marks OR is inline math */
					// 	decorations.push(Decoration.widget(pos, wrapWidget(state, node, pos)));
					// }
				});
				return DecorationSet.create(state.doc, decorations);
			},
		},
	});
};
