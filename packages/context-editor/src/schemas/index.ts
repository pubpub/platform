import { Schema } from "prosemirror-model";

import blockquote from "./blockquote";
import inlineCode from "./code";
import contextAtom from "./contextAtom";
import contextDoc from "./contextDoc";
// import { marks, nodes } from "prosemirror-schema-basic";

/* Nodes */
import doc from "./doc";
import em from "./em";
import heading from "./heading";
import paragraph from "./paragraph";
/* Marks */
import strong from "./strong";
import text from "./text";

export const baseSchema = new Schema({
	nodes: {
		doc,
		paragraph,
		text,
		heading,
		contextDoc,
		contextAtom,
		blockquote,
	},
	marks: {
		strong,
		em,
		code: inlineCode,
	},
	topNode: "doc",
});
