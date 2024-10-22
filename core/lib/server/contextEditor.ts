import { Schema } from "prosemirror-model";

/** Temporary stub schema while we have not imported the context editor yet */
const STUB_SCHEMA = new Schema({
	nodes: {
		doc: { content: "paragraph+" },
		paragraph: { content: "text*" },
		text: { inline: true },
	},
});

export const validateAgainstContextEditorSchema = (value: unknown) => {
	try {
		const node = STUB_SCHEMA.nodeFromJSON(value);
		node.check();
		return true;
	} catch {
		return false;
	}
};
