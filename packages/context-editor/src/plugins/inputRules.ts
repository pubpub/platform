import type { MarkType, NodeType } from "prosemirror-model"
import type { EditorState } from "prosemirror-state"

import {
	makeBlockMathInputRule,
	makeInlineMathInputRule,
	REGEX_BLOCK_MATH_DOLLARS,
	REGEX_INLINE_MATH_DOLLARS,
} from "@benrbray/prosemirror-math"
import { InputRule, inputRules } from "prosemirror-inputrules"
import { Fragment, type Schema } from "prosemirror-model"

import initialDoc from "../stories/initialDoc.json"
import { createLinkRuleHandler, emailOrUriRegexBase, markdownLinkRegex } from "../utils/links"

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
}

const italicsRegex = /([_*])([^*]+?)\1\x20$/
const boldRegex = /(\*\*|__)([^*]+?)\1\x20$/
const codeRegex = /(`)([^`]+)\1\x20/

const applyMarkRule = (markType: MarkType, regex: RegExp) => {
	return new InputRule(
		regex,
		(state: EditorState, match: RegExpMatchArray, start: number, end: number) => {
			const [_whole, _marks, content] = match
			const fragment = Fragment.fromArray([
				state.schema.text(content, [state.schema.mark(markType)]),
				state.schema.text(" "),
			])
			return state.tr.replaceWith(start, end, fragment)
		}
	)
}
const inlineMathRule = (nodeType: NodeType) =>
	makeInlineMathInputRule(REGEX_INLINE_MATH_DOLLARS, nodeType)
const blockMathRule = (nodeType: NodeType) =>
	makeBlockMathInputRule(REGEX_BLOCK_MATH_DOLLARS, nodeType)

const EMAIL_OR_URI_REGEX_WITH_SPACE = new RegExp(`${emailOrUriRegexBase}(?<whitespace>\\s)$`)

// Given a link mark type, returns an input rule that wraps emails and URLs in link marks.
// Typing www.example.com in the editor will produce <a href="www.example.com">www.example.com</a>
// and typing email@example.com will produce <a href="mailto:email@example.com">email@example.com</a>
const linkRule = (markType: MarkType) =>
	new InputRule(EMAIL_OR_URI_REGEX_WITH_SPACE, createLinkRuleHandler(markType, undefined, true))

// Rule to recognize markdown link syntax and return a link:
// [text](https://www.example.com) -> <a href="https://www.example.com">text</a>
const markdownLinkRule = (markType: MarkType) =>
	new InputRule(markdownLinkRegex, (state, match, start, end) => {
		const [_, text, url] = match
		const fragment = Fragment.fromArray([
			state.schema.text(text, [state.schema.mark(markType, { href: url })]),
			state.schema.text(" "),
		])
		return state.tr.replaceWith(start, end, fragment)
	})

export default function inputRulesPlugin(schema: Schema) {
	const rules = [
		new InputRule(/^AI please!$/, (state, _match, start, end) => {
			const contentToInsert = state.schema.nodeFromJSON(initialDoc).content
			return state.tr.replaceWith(start - 1, end, contentToInsert)
		}),
		new InputRule(/^Abstract please!$/, (state, _match, start, end) => {
			const contentToInsert = state.schema.nodeFromJSON(abstract).content
			return state.tr.replaceWith(start - 1, end, contentToInsert)
		}),
		markdownLinkRule(schema.marks.link),
		linkRule(schema.marks.link),
		// The order is significant here since bold uses a superset of italic (** vs * or __ vs _)
		// Prosemirror applies the first rule that matches
		applyMarkRule(schema.marks.strong, boldRegex),
		applyMarkRule(schema.marks.em, italicsRegex),
		applyMarkRule(schema.marks.code, codeRegex),
		inlineMathRule(schema.nodes.math_inline),
		blockMathRule(schema.nodes.math_display),
	]
	return inputRules({ rules })
}
