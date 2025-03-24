import { Plugin } from "prosemirror-state";

import { attributePanelKey } from "./attributePanel";
import { reactPropsKey } from "./reactProps";

export default () => {
	return new Plugin({
		view: () => {
			return {
				update: (editorView) => {
					const { onChange } = reactPropsKey.getState(editorView.state);
					const { panelPosition, setPanelPosition } = attributePanelKey.getState(
						editorView.state
					);
					if (panelPosition.pos !== editorView.state.selection.$from.pos) {
						setPanelPosition({
							...panelPosition,
							pos: editorView.state.selection.$from.pos,
						});
					}
					onChange(editorView.state);
				},
			};
		},
	});
};
