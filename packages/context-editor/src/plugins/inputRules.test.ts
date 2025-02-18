import { inputRules } from "prosemirror-inputrules";
import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { describe, expect, test } from "vitest";

import { baseSchema } from "../schemas";
import { markIsActive } from "../utils/marks";
import { markdownBoldRule, markdownItalicsRule } from "./inputRules";

describe("inputRules", () => {
	const rules = inputRules({
		rules: [
			markdownBoldRule(baseSchema.marks.strong),
			markdownItalicsRule(baseSchema.marks.em),
		],
	});
	const plugins = [rules];

	const paragraphNode = baseSchema.node("paragraph", null, []);
	const doc = baseSchema.node("doc", null, [paragraphNode]);

	const state = EditorState.create({
		doc,
		plugins,
		selection: TextSelection.create(doc, 1, 1),
	});

	const container = document.createElement("div");
	document.body.append(container);
	const view = new EditorView(container, { state });

	/**
	 * Helper function to try to write text in a way that can trigger an input rule.
	 * */
	const write = (text: string) => {
		// Clear the editor's contents first
		view.dispatch(view.state.tr.replace(0, view.state.doc.content.size));
		const { from, to } = view.state.selection;
		let ruleApplied = false;
		view.someProp("handleTextInput", (f) => {
			if (f(view, from, to, text)) {
				ruleApplied = true;
			}
		});
		// view.someProp doesn't write the text if the rule does not apply, so manually write it here
		if (!ruleApplied) {
			const newState = view.state.apply(view.state.tr.insertText(text));
			return newState.doc.textContent;
		}
		const newText = view.state.doc.textBetween(to, view.state.doc.content.size);
		return newText;
	};

	/**
	 * Moves the selection back to the beginning of the doc
	 * This is useful for testing the marks applied at a selection */
	const moveSelection = (head: number) => {
		const selection = TextSelection.create(view.state.doc, head);
		view.dispatch(view.state.tr.setSelection(selection));
	};

	test.each([
		{ text: "*hi* ", expected: { text: "hi ", isItalicized: true } },
		{ text: "_hi_ ", expected: { text: "hi ", isItalicized: true } },
		{ text: "*hi_ ", expected: { text: "*hi_ ", isItalicized: false } },
		{ text: "*hi_* ", expected: { text: "hi_ ", isItalicized: true } },
	])("italics $text", ({ text, expected }) => {
		expect(write(text)).toEqual(expected.text);
		moveSelection(1);
		expect(markIsActive(baseSchema.marks.em, view.state)).toEqual(expected.isItalicized);
	});

	test.each([
		{ text: "**hi** ", expected: { text: "hi ", isBold: true, isItalicized: false } },
		{ text: "__hi__ ", expected: { text: "hi ", isBold: true, isItalicized: false } },
		{ text: "__hi** ", expected: { text: "__hi** ", isBold: false, isItalicized: false } },
		{ text: "__h_i__ ", expected: { text: "h_i ", isBold: true, isItalicized: false } },
	])("bold $text", ({ text, expected }) => {
		expect(write(text)).toEqual(expected.text);
		moveSelection(1);
		expect(markIsActive(baseSchema.marks.strong, view.state)).toEqual(expected.isBold);
		expect(markIsActive(baseSchema.marks.em, view.state)).toEqual(expected.isItalicized);
	});
});
