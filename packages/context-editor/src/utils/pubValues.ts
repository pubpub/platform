import { EditorState } from "prosemirror-state";

export const getPubValues = (editorState: EditorState) => {
	const editedPubs = {};
	editorState.doc.descendants((node, pos) => {
		if (node.type.name === 'contextAtom' || node.type.name === 'contextDoc') {
			console.log(node);
			/* TODO: We eventually need to look up the pubType and get the
			'default' field value if no explicit fieldSlug listed */
			const content = {...node.attrs.data}
			if (node.type.name === 'contextDoc') {
				const fieldSlug = node.attrs.fieldSlug || 'rd:content';
				content[fieldSlug] = node.toJSON().content;
			}
			editedPubs[node.attrs.pubId] = content;
		}
		
		
	});
	return editedPubs;
}