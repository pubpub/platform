import deepMerge from "deepmerge";
import { EditorState } from "prosemirror-state";

export const getPubValues = (editorState: EditorState, pubId: string) => {
	const editedPubs: { [key: string]: { id: string; pubTypeId: string; values: any } } = {};
	// editedPubs[pubId] = {
	// 	id: pubId,
	// 	pubTypeId: "67704c04-4f04-46e9-b93e-e3988a992a9b",
	// 	values: {
	// 		"rd:content": editorState.doc.toJSON(),
	// 	},
	// };
	editorState.doc.descendants((node, pos) => {
		if (node.type.name === "contextAtom" || node.type.name === "contextDoc") {
			/* TODO: We eventually need to look up the pubType and get the
			'default' field value if no explicit fieldSlug listed */
			const content = {
				pubId: node.attrs.pubId,
				parentPubId: node.attrs.parentPubId,
				pubTypeId: node.attrs.pubTypeId,
				values: { ...node.attrs.data },
			};
			if (node.type.name === "contextDoc") {
				const fieldSlug = node.attrs.fieldSlug || "rd:content";
				/* TODO: remove demo example from abstract */
				content.values[fieldSlug] =
					fieldSlug === "rd:abstract" ? node.textContent : node.toJSON().content;
			}
			const existingContent = editedPubs[node.attrs.pubId];
			editedPubs[node.attrs.pubId] = deepMerge(existingContent, content);
		}
	});

	return editedPubs;
};
