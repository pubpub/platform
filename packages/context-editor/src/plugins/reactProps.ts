import type { ContextEditorProps } from "../ContextEditor"

import { Plugin, PluginKey } from "prosemirror-state"

export const reactPropsKey = new PluginKey("reactProps")
export default function reactPropsPlugin(initialProps: ContextEditorProps) {
	return new Plugin({
		key: reactPropsKey,
		state: {
			init: () => initialProps,
			apply: (tr, prev) => tr.getMeta(reactPropsKey) || prev,
		},
	})
}
