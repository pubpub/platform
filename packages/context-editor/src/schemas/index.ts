import { Schema } from "prosemirror-model";
// import { marks, nodes } from "prosemirror-schema-basic";

/* Nodes */
import doc from "./doc";
import paragraph from "./paragraph";
import text from "./text";
import heading from "./heading";
import contextDoc from "./contextDoc";
import contextAtom from "./contextAtom";

/* Marks */
import strong from "./strong";
import em from "./em";

export const baseSchema = new Schema({
	nodes: {
		doc,
		paragraph,
		text,
		heading,
		contextDoc,
		contextAtom,
	},
	marks: {
		strong,
		em,
	},
	topNode: "doc",
});
