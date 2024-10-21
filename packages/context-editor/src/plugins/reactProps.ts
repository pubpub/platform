import { Plugin, PluginKey } from "prosemirror-state";

import { ContextEditorProps } from "../ContextEditor";

export const reactPropsKey = new PluginKey("reactProps");
export default (initialProps: ContextEditorProps) => {
	return new Plugin({
		key: reactPropsKey,
		state: {
			init: () => initialProps,
			apply: (tr, prev) => tr.getMeta(reactPropsKey) || prev,
		},
	});
};
