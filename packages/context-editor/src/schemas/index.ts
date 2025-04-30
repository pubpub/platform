import { Schema } from "prosemirror-model";

import blockquote from "./blockquote";
import caption from "./caption";
import code from "./code";
import contextAtom from "./contextAtom";
import contextDoc from "./contextDoc";
import doc from "./doc";
import em from "./em";
import figure from "./figure";
import hard_break from "./hard_break";
import heading from "./heading";
import horizontal_rule from "./horizontal";
import image from "./image";
import link from "./link";
import list from "./list";
import math from "./math";
import paragraph from "./paragraph";
import strike from "./strike";
import strong from "./strong";
import subSuperScript from "./subSuperScript";
import table from "./table";
import text from "./text";
import title from "./title";
import underline from "./underline";

export const baseSchema = new Schema({
	nodes: {
		doc,
		paragraph,
		text,
		hard_break,
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
		...table,
		title,
		figure,
		caption,
	},
	marks: {
		strong,
		em,
		code: code.codeInline,
		link,
		strike,
		sub: subSuperScript.sub,
		sup: subSuperScript.sup,
		underline,
	},
	topNode: "doc",
});
