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
import list from "./list";
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
		bullet_list: list.bulletList,
		ordered_list: list.orderedList,
		list_item: list.listItem,
	},
	marks: {
		strong,
		em,
		code: code.codeInline,
	},
	topNode: "doc",
});
