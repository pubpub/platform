import { Schema } from "prosemirror-model";

import blockquote from "./blockquote";
import code from "./code";
import contextAtom from "./contextAtom";
import contextDoc from "./contextDoc";
import doc from "./doc";
import em from "./em";
import heading from "./heading";
import horizontal_rule from "./horizontal";
import image from "./image";
import link from "./link";
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
		code_block: code.codeBlock,
		image,
		horizontal_rule,
	},
	marks: {
		strong,
		em,
		code: code.codeInline,
		link,
	},
	topNode: "doc",
});
