import { Schema } from "prosemirror-model";
import { marks, nodes } from "prosemirror-schema-basic";

import doc from "./doc";
import paragraph from "./paragraph";
import text from "./text";
import heading from "./heading";
import contextDoc from "./contextDoc";
import contextAtom from "./contextAtom";

export const baseSchema = new Schema({
	nodes: {
		doc,
		paragraph,
		text,
		heading,
		contextDoc,
		contextAtom,
	},
	marks: marks,
	topNode: "doc",
});
