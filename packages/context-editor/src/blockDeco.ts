import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

import { reactPropsKey } from "./ContextEditor";
import { panelKey } from "./ContextEditor";

function wrapWidget(node, setPanelPosition) {
	return () => {
		let widget = document.createElement("div");
		widget.className = "wrap-widget";
		let widgetChild = document.createElement("button");
		widget.appendChild(widgetChild);
		widgetChild.innerHTML = `${node.type.name}${node.type.name === 'heading' ? ` ${node.attrs.level}`: ''}`;
		widgetChild.addEventListener("click", (evt) => {
			const rect = evt.target.getBoundingClientRect();
			setPanelPosition([rect.top,"5px",rect.left])
		});
		return widget;
	};
}

export default function blockDecoPlugin() {
	return new Plugin({
		props: {
			decorations: (state) => {
				// console.log(state);
				// console.log(reactPropsKey.getState(state));
				const decorations: Decoration[] = [];
				const setPanelPosition = panelKey.getState(state);
				state.doc.descendants((node, pos) => {
					console.log('node', node)
					if (node.type.isBlock) {
						decorations.push(Decoration.widget(pos, wrapWidget(node, setPanelPosition)));
					}
				});
				return DecorationSet.create(state.doc, decorations);
				// return null;
			},
		},
	});
}
