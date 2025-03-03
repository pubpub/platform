import type { MarkType, NodeType } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";

import {
	makeBlockMathInputRule,
	makeInlineMathInputRule,
	REGEX_BLOCK_MATH_DOLLARS,
	REGEX_INLINE_MATH_DOLLARS,
} from "@benrbray/prosemirror-math";
import {
	InputRule,
	inputRules,
	textblockTypeInputRule,
	wrappingInputRule,
} from "prosemirror-inputrules";
import { Fragment, Schema } from "prosemirror-model";

import initialDoc from "../stories/initialDoc.json";

const abstract = {
	type: "doc",
	attrs: { meta: {} },
	content: [
		{
			type: "paragraph",
			attrs: { id: null, class: null },
			content: [
				{
					type: "text",
					text: 'This paper investigates the dynamic behavior of nano-particles interacting with elastic membranes, referred to as "nano-particle trampolines," under oscillatory forces. By fabricating ultra-thin, flexible membranes and controlling nano-particle movement through external stimuli, we explore potential applications in fields such as nano-sensing and targeted drug delivery. Theoretical models are developed to predict particle motion and stability, which are validated through experimental data, including high-resolution microscopy and dynamic force measurements. Our findings demonstrate that the behavior of nano-particles on elastic surfaces can be precisely manipulated, opening new possibilities for their use in advanced nanotechnology applications. Potential challenges related to scalability and environmental stability are discussed, along with the implications for future research and development.',
				},
			],
		},
	],
};

const italicsRegex = /([_*])([^]+?)\1\x20$/;
const boldRegex = /(\*\*|__)([^]+?)\1\x20$/;
const codeRegex = /(`)([^`]+)\1\x20/;

const applyMarkRule = (markType: MarkType, regex: RegExp) => {
	return new InputRule(
		regex,
		(state: EditorState, match: RegExpMatchArray, start: number, end: number) => {
			const [whole, marks, content] = match;
			const fragment = Fragment.fromArray([
				state.schema.text(content, [state.schema.mark(markType)]),
				state.schema.text(" "),
			]);
			return state.tr.replaceWith(start, end, fragment);
		}
	);
};
const blockQuoteRule = (nodeType: NodeType) => wrappingInputRule(/^\s*>\s$/, nodeType);
const inlineMathRule = (nodeType: NodeType) =>
	makeInlineMathInputRule(REGEX_INLINE_MATH_DOLLARS, nodeType);
const blockMathRule = (nodeType: NodeType) =>
	makeBlockMathInputRule(REGEX_BLOCK_MATH_DOLLARS, nodeType);
const codeBlockRule = (nodeType: NodeType) => textblockTypeInputRule(/^```$/, nodeType);

export default (schema: Schema) => {
	const rules = [
		new InputRule(/^AI please!$/, (state, match, start, end) => {
			const contentToInsert = state.schema.nodeFromJSON(initialDoc).content;
			return state.tr.replaceWith(start - 1, end, contentToInsert);
		}),
		new InputRule(/^Abstract please!$/, (state, match, start, end) => {
			const contentToInsert = state.schema.nodeFromJSON(abstract).content;
			return state.tr.replaceWith(start - 1, end, contentToInsert);
		}),
		// The order is significant here since bold uses a superset of italic (** vs * or __ vs _)
		// Prosemirror applies the first rule that matches
		applyMarkRule(schema.marks.strong, boldRegex),
		applyMarkRule(schema.marks.em, italicsRegex),
		applyMarkRule(schema.marks.code, codeRegex),
		blockQuoteRule(schema.nodes.blockquote),
		inlineMathRule(schema.nodes.math_inline),
		blockMathRule(schema.nodes.math_display),
		codeBlockRule(schema.nodes.code_block),
	];
	return inputRules({ rules });
};
