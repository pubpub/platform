import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

import { reactPropsKey } from "./ContextEditor";
import { panelKey } from "./ContextEditor";

function wrapWidget(node, setPanelPosition) {
	return () => {
		let widget = document.createElement("span");
		widget.className = "inline-wrap-widget";
		let widgetLineChild = document.createElement("span");
		widget.appendChild(widgetLineChild);
		let widgetChild = document.createElement("button");
		widget.appendChild(widgetChild);
		widgetChild.addEventListener("click", (evt) => {
			const rect = evt.target.getBoundingClientRect();
			setPanelPosition([rect.top - 13,"-250px",rect.left])
		});
		return widget;
	};
}

export default function inlineDecorationsPlugin() {
	return new Plugin({
		props: {
			decorations: (state) => {
				// console.log(state);
				// console.log(reactPropsKey.getState(state));
				const decorations: Decoration[] = [];
				const setPanelPosition = panelKey.getState(state);
				state.doc.descendants((node, pos) => {
					if (!node.type.isBlock && node.marks.length) {
						
						decorations.push(Decoration.widget(pos, wrapWidget(node, setPanelPosition)));
					}
				});
				return DecorationSet.create(state.doc, decorations);
				// return null;
			},
		},
	});
}
