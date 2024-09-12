import { Plugin, PluginKey } from "prosemirror-state";

import { PanelProps } from "../ContextEditor";

export const attributePanelKey = new PluginKey("panel");
export default (setPanelPosition: React.Dispatch<React.SetStateAction<PanelProps>>) => {
	return new Plugin({
		key: attributePanelKey,
		state: {
			init: () => setPanelPosition,
			apply: (tr, prev) => tr.getMeta(attributePanelKey) || prev,
		},
	});
};
