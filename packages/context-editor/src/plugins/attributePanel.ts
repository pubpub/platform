import { Plugin, PluginKey } from "prosemirror-state"

import type { PanelProps } from "../ContextEditor"

export const attributePanelKey = new PluginKey("panel")
export default (
	panelPosition: PanelProps,
	setPanelPosition: React.Dispatch<React.SetStateAction<PanelProps>>
) => {
	return new Plugin({
		key: attributePanelKey,
		state: {
			init: () => {
				return { panelPosition, setPanelPosition }
			},
			apply: (tr, prev) => tr.getMeta(attributePanelKey) || prev,
		},
	})
}
