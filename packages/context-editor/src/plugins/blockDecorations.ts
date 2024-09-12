import { Node } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

import { PanelProps } from "../ContextEditor";
// import { setWidgetClickListener } from "../utils/widgetEvents";
import { attributePanelKey } from "./attributePanel";

function wrapWidget(
	node: Node,
	pos: number,
	setPanelPosition: React.Dispatch<React.SetStateAction<PanelProps>>
) {
	return () => {
		const isBlock = node.isBlock;
		const widget = document.createElement(isBlock ? "div" : "span");
		widget.className = isBlock ? "wrap-widget" : "inline-wrap-widget";
		const widgetLineChild = document.createElement("span");
		widget.appendChild(widgetLineChild);
		const widgetButtonChild = document.createElement("button");
		widget.appendChild(widgetButtonChild);
		if (isBlock) {
			widgetButtonChild.innerHTML = `${node.type.name}${node.type.name === "heading" ? ` ${node.attrs.level}` : ""}`;
		}

		// setWidgetClickListener(widgetButtonChild, node, pos, setPanelPosition);
		widget.addEventListener("click", (evt) => {
			if (evt.target instanceof Element) {
				const rect = evt.target.getBoundingClientRect();
				setPanelPosition({
					top: rect.top,
					left: rect.left,
					bottom: rect.bottom,
					// right: rect.right,
					right: -250,
					pos,
					node,
				});
			}
		});
		return widget;
	};
}

export default () => {
	return new Plugin({
		props: {
			decorations: (state) => {
				const decorations: Decoration[] = [];
				const setPanelPosition = attributePanelKey.getState(state);
				state.doc.descendants((node, pos) => {
					if (node.type.isBlock) {
						decorations.push(
							Decoration.widget(pos, wrapWidget(node, pos, setPanelPosition))
						);
					}
					if (!node.type.isBlock && node.marks.length) {
						/* If it's an inline node with marks */
						decorations.push(
							Decoration.widget(pos, wrapWidget(node, pos, setPanelPosition))
						);
					}
				});
				return DecorationSet.create(state.doc, decorations);
			},
		},
	});
};
