/**
 * Based on https://gitlab.com/emergence-engineering/prosemirror-codemirror-block/-/blob/main/src/utils.ts
 *
 * Differences:
 * * No isTheme, setTheme
 * * No createCodeBlock, removeCodeBlock, toggleCodeBlock, codeBlockToggleShortcut, codeBlockKeymap
 */

// From prosemirror guide
import { Compartment } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { setBlockType } from "prosemirror-commands";
import { Fragment, Node } from "prosemirror-model";
import { EditorState, Selection, TextSelection, Transaction } from "prosemirror-state";
import { EditorView as PMEditorView } from "prosemirror-view";

import type { CodeBlockSettings } from "./types";
import { CodeBlockLanguages } from "./languages";

export function computeChange(oldVal: string, newVal: string) {
	if (oldVal === newVal) return null;
	let start = 0;
	let oldEnd = oldVal.length;
	let newEnd = newVal.length;
	while (start < oldEnd && oldVal.charCodeAt(start) === newVal.charCodeAt(start)) start += 1;
	while (
		oldEnd > start &&
		newEnd > start &&
		oldVal.charCodeAt(oldEnd - 1) === newVal.charCodeAt(newEnd - 1)
	) {
		oldEnd -= 1;
		newEnd -= 1;
	}
	return { from: start, to: oldEnd, text: newVal.slice(start, newEnd) };
}

export const asProseMirrorSelection = (
	pmDoc: Node,
	cmView: EditorView,
	getPos: (() => number) | boolean
) => {
	const offset = (typeof getPos === "function" ? getPos() || 0 : 0) + 1;
	const anchor = cmView.state.selection.main.from + offset;
	const head = cmView.state.selection.main.to + offset;
	return TextSelection.create(pmDoc, anchor, head);
};

export const forwardSelection = (
	cmView: EditorView,
	pmView: PMEditorView,
	getPos: (() => number) | boolean
) => {
	if (!cmView.hasFocus) return;
	const selection = asProseMirrorSelection(pmView.state.doc, cmView, getPos);
	if (!selection.eq(pmView.state.selection))
		pmView.dispatch(pmView.state.tr.setSelection(selection));
};

export const valueChanged = (
	textUpdate: string,
	node: Node,
	getPos: (() => number) | boolean,
	view: PMEditorView
) => {
	const change = computeChange(node.textContent, textUpdate);
	if (change && typeof getPos === "function") {
		const start = getPos() + 1;

		const pmTr = view.state.tr.replaceWith(
			start + change.from,
			start + change.to,
			change.text ? view.state.schema.text(change.text) : Fragment.empty
		);
		view.dispatch(pmTr);
	}
};

export const maybeEscape = (
	unit: "char" | "line",
	dir: -1 | 1,
	cm: EditorView,
	view: PMEditorView,
	getPos: boolean | (() => number)
) => {
	const sel = cm.state.selection.main;
	const line = cm.state.doc.lineAt(sel.from);
	const lastLine = cm.state.doc.lines;
	if (
		sel.to !== sel.from ||
		line.number !== (dir < 0 ? 1 : lastLine) ||
		(unit === "char" && sel.from !== (dir < 0 ? 0 : line.to)) ||
		typeof getPos !== "function"
	)
		return false;
	view.focus();
	const node = view.state.doc.nodeAt(getPos());
	if (!node) return false;
	const targetPos = getPos() + (dir < 0 ? 0 : node.nodeSize);
	const selection = Selection.near(view.state.doc.resolve(targetPos), dir);
	view.dispatch(view.state.tr.setSelection(selection).scrollIntoView());
	view.focus();
	return true;
};

export const backspaceHandler = (pmView: PMEditorView, view: EditorView) => {
	const { selection } = view.state;
	if (selection.main.empty && selection.main.from === 0) {
		setBlockType(pmView.state.schema.nodes.paragraph)(pmView.state, pmView.dispatch);
		setTimeout(() => pmView.focus(), 20);
		return true;
	}
	return false;
};

export const setMode = async (
	lang: (typeof CodeBlockLanguages)[number],
	cmView: EditorView,
	settings: CodeBlockSettings,
	languageConf: Compartment
) => {
	const support = await settings.languageLoaders?.[lang]?.();
	if (support) {
		cmView.dispatch({
			effects: languageConf.reconfigure(support),
		});
	}
};

const arrowHandler =
	(dir: "left" | "right" | "up" | "down") =>
	(
		state: EditorState,
		dispatch: ((tr: Transaction) => void) | undefined,
		view?: PMEditorView
	) => {
		if (state.selection.empty && view?.endOfTextblock(dir)) {
			const side = dir === "left" || dir === "up" ? -1 : 1;
			const { $head } = state.selection;
			const nextPos = Selection.near(
				state.doc.resolve(side > 0 ? $head.after() : $head.before()),
				side
			);
			if (nextPos.$head && nextPos.$head.parent.type.name === "code_block") {
				dispatch?.(state.tr.setSelection(nextPos));
				return true;
			}
		}
		return false;
	};

export const codeBlockArrowHandlers = {
	ArrowLeft: arrowHandler("left"),
	ArrowRight: arrowHandler("right"),
	ArrowUp: arrowHandler("up"),
	ArrowDown: arrowHandler("down"),
};
