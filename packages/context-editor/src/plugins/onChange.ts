import { Plugin } from "prosemirror-state";
import initialPubs from "../stories/initialPubs.json";
import { reactPropsKey } from "./reactProps";

import { baseSchema } from "../schemas";

export default () => {
	return new Plugin({
		view: () => {
			return {
				update: (editorView) => {
					// console.log(initialPubs[0].children[0].values['rd:content'])
					const { onChange } = reactPropsKey.getState(editorView.state);
					onChange(editorView.state);
				},
			};
		},
	});
};
