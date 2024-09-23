import { EditorState } from "prosemirror-state";

export const getPubValues = (editorState: EditorState, pubId: string) => {
	const editedPubs = {};
	editedPubs[pubId] = {
		"rd:content": editorState.doc.toJSON(),
	};
	editorState.doc.descendants((node, pos) => {
		if (node.type.name === "contextAtom" || node.type.name === "contextDoc") {
			console.log(node);
			/* TODO: We eventually need to look up the pubType and get the
			'default' field value if no explicit fieldSlug listed */
			const content = { ...node.attrs.data };
			if (node.type.name === "contextDoc") {
				const fieldSlug = node.attrs.fieldSlug || "rd:content";
				content[fieldSlug] = node.toJSON().content;
			}
			const existingContent = editedPubs[node.attrs.pubId];
			editedPubs[node.attrs.pubId] = { ...existingContent, ...content };
		}
	});
	console.log("pubId", pubId);

	return editedPubs;
};
