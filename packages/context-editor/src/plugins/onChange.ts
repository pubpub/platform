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
					const { onChange, initialDoc } = reactPropsKey.getState(editorView.state);
					// console.log(editorView.state.doc.toJSON());
					const initialDocNode = baseSchema.nodeFromJSON(initialDoc);
					const isDiff = editorView.state.doc.content.findDiffStart(initialDocNode.content);
					console.log(isDiff ? 'Changed true' : 'false')

					onChange(editorView.state);
				},
			};
		},
	});
};
