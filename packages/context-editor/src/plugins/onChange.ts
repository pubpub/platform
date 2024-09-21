import { Plugin } from "prosemirror-state";

import { reactPropsKey } from "./reactProps";

export default () => {
	return new Plugin({
		view: () => {
			return {
				update: (editorView) => {
					const { onChange } = reactPropsKey.getState(editorView.state);

					onChange(editorView.state);
				},
			};
		},
	});
};
