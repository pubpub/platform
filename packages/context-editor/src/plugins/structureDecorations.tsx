import React from "react";
import { widget } from "@handlewithcare/react-prosemirror";
import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

import { BlockDecoration } from "../components/StructureDecoration";

export default () => {
	return new Plugin({
		props: {
			decorations: (state) => {
				const decorations: Decoration[] = [];
				// const { setPanelPosition } = attributePanelKey.getState(state);
				state.doc.descendants((node, pos) => {
					if (node.type.isBlock) {
						decorations.push(widget(pos, BlockDecoration, { key: `node-${pos}` }));
					}
				});
				return DecorationSet.create(state.doc, decorations);
			},
		},
	});
};
