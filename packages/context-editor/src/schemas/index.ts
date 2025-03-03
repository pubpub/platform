import { Schema } from "prosemirror-model";

import blockquote from "./blockquote";
import inlineCode from "./code";
import contextAtom from "./contextAtom";
import contextDoc from "./contextDoc";
import doc from "./doc";
import em from "./em";
import heading from "./heading";
import math from "./math";
import paragraph from "./paragraph";
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
		...math,
	},
	marks: {
		strong,
		em,
		code: inlineCode,
	},
	topNode: "doc",
});
