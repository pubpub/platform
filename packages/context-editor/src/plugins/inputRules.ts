import type { MarkType, NodeType, Schema } from "prosemirror-model";
import type { EditorState, Transaction } from "prosemirror-state";

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
import { Fragment } from "prosemirror-model";

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

const emailOrUriRegexBase =
	"(?<emailOrUri>(?:(?:(https|http|ftp)+)://)?(?:\\S+(?::\\S*)?(?<atSign>@))?(?:(?:([a-z0-9][a-z0-9-]*)?[a-z0-9]+)(?:\\.(?:[a-z0-9-])*[a-z0-9]+)*(?:\\.(?:[a-z]{2,})(:\\d{1,5})?))(?:/[^\\s]*)?)";

// Export a version of the regex and handler so that we can reuse this logic in a custom command
// mapped to the `enter` key, because input rules don't work across nodes
export const EMAIL_OR_URI_REGEX = new RegExp(`${emailOrUriRegexBase}$`);

const EMAIL_OR_URI_REGEX_WITH_SPACE = new RegExp(`${emailOrUriRegexBase}(?<whitespace>\\s)$`);

// Returns a function to determine if the matched content is a url or an email and add a link mark
// to it if so
export const createLinkRuleHandler = (
	markType: MarkType,
	transaction?: Transaction,
	appendWhitespace = false
) => {
	return (state: EditorState, match: RegExpMatchArray, start: number, end: number) => {
		const resolvedStart = state.doc.resolve(start);
		const tr = transaction ?? state.tr;
		if (!resolvedStart.parent.type.allowsMarkType(markType)) {
			return tr;
		}

		if (!match.groups) {
			return tr;
		}
		const emailOrUri = match.groups.emailOrUri;

		const href = `${match.groups.atSign ? "mailto:" : ""}${emailOrUri}`;

		const link = state.schema.text(emailOrUri, [state.schema.mark(markType, { href })]);

		const content = [link];

		if (appendWhitespace) {
			const whitespace = state.schema.text(match.groups.whitespace);
			content.push(whitespace);
		}

		return tr.replaceWith(start, end, content);
	};
};

// Given a link mark type, returns an input rule that wraps emails and URLs in link marks.
// Typing www.example.com in the editor will produce <a href="www.example.com">www.example.com</a>
// and typing email@example.com will produce <a href="mailto:email@example.com">email@example.com</a>
const linkRule = (markType: MarkType) =>
	new InputRule(EMAIL_OR_URI_REGEX_WITH_SPACE, createLinkRuleHandler(markType, undefined, true));

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
		linkRule(schema.marks.link),
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
