/**
 * Based on https://gitlab.com/emergence-engineering/prosemirror-codemirror-block/-/blob/main/src/codeMirrorBlockNodeView.ts
 *
 * Differences:
 * * Includes `codeblock-wrapper` as dom
 * * No theme or copy button
 */

import type { NodeView } from "prosemirror-view";

import {
	autocompletion,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
} from "@codemirror/autocomplete";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import {
	bracketMatching,
	defaultHighlightStyle,
	foldGutter,
	foldKeymap,
	indentOnInput,
	syntaxHighlighting,
} from "@codemirror/language";
import { highlightSelectionMatches, selectNextOccurrence } from "@codemirror/search";
import { Compartment, EditorState } from "@codemirror/state";
import {
	drawSelection,
	EditorView,
	highlightActiveLine,
	highlightActiveLineGutter,
	keymap,
	lineNumbers,
	rectangularSelection,
} from "@codemirror/view";
import { exitCode, selectAll } from "prosemirror-commands";
import { Node } from "prosemirror-model";
import { EditorView as PMEditorView } from "prosemirror-view";

import type { CodeBlockSettings } from "./types";
import {
	backspaceHandler,
	computeChange,
	forwardSelection,
	maybeEscape,
	setMode,
	valueChanged,
} from "./utils";

export const codeMirrorBlockNodeView = (settings: CodeBlockSettings) => {
	return (pmNode: Node, view: PMEditorView, getPos: (() => number) | boolean): NodeView => {
		let node = pmNode;
		let updating = false;
		const wrap = document.createElement("pre");
		wrap.className = "codeblock-wrapper";
		const dom = document.createElement("code");
		wrap.append(dom);
		dom.className = "codeblock-root";
		const languageConf = new Compartment();
		const state = EditorState.create({
			extensions: [
				EditorState.readOnly.of(settings.readOnly),
				EditorView.editable.of(!settings.readOnly),
				lineNumbers(),
				highlightActiveLineGutter(),
				foldGutter(),
				bracketMatching(),
				closeBrackets(),
				highlightSelectionMatches(),
				autocompletion(),
				rectangularSelection(),
				drawSelection({ cursorBlinkRate: 1000 }),
				EditorState.allowMultipleSelections.of(true),
				highlightActiveLine(),
				syntaxHighlighting(defaultHighlightStyle),
				languageConf.of([]),
				indentOnInput(),
				EditorView.domEventHandlers({
					blur(event, cmView) {
						cmView.dispatch({ selection: { anchor: 0 } });
					},
				}),
				keymap.of([
					{ key: "Mod-d", run: selectNextOccurrence, preventDefault: true },
					{
						key: "ArrowUp",
						run: (cmView) => maybeEscape("line", -1, cmView, view, getPos),
					},
					{
						key: "ArrowLeft",
						run: (cmView) => maybeEscape("char", -1, cmView, view, getPos),
					},
					{
						key: "ArrowDown",
						run: (cmView) => maybeEscape("line", 1, cmView, view, getPos),
					},
					{
						key: "ArrowRight",
						run: (cmView) => maybeEscape("char", 1, cmView, view, getPos),
					},
					{
						key: "Mod-z",
						run: () => settings.undo?.(view.state, view.dispatch) || true,
						shift: () => settings.redo?.(view.state, view.dispatch) || true,
					},
					{
						key: "Mod-y",
						run: () => settings.redo?.(view.state, view.dispatch) || true,
					},
					{ key: "Backspace", run: (cmView) => backspaceHandler(view, cmView) },
					{
						key: "Mod-Backspace",
						run: (cmView) => backspaceHandler(view, cmView),
					},
					{
						key: "Mod-a",
						run: () => {
							const result = selectAll(view.state, view.dispatch);
							view.focus();
							return result;
						},
					},
					{
						key: "Enter",
						run: (cmView) => {
							const sel = cmView.state.selection.main;
							if (
								cmView.state.doc.line(cmView.state.doc.lines).text === "" &&
								sel.from === sel.to &&
								sel.from === cmView.state.doc.length
							) {
								exitCode(view.state, view.dispatch);
								view.focus();
								return true;
							}
							return false;
						},
					},
					...defaultKeymap,
					...foldKeymap,
					...closeBracketsKeymap,
					...completionKeymap,
					indentWithTab,
				]),
				...(settings.theme ? settings.theme : []),
			],
			doc: node.textContent,
		});

		const codeMirrorView = new EditorView({
			state,
			dispatch: (tr) => {
				codeMirrorView.update([tr]);
				if (!updating) {
					const textUpdate = tr.state.toJSON().doc;
					valueChanged(textUpdate, node, getPos, view);
					forwardSelection(codeMirrorView, view, getPos);
				}
			},
		});
		dom.append(codeMirrorView.dom);

		const selectDeleteCB = settings.createSelect(settings, dom, node, view, getPos);
		setMode(node.attrs.lang, codeMirrorView, settings, languageConf);

		return {
			dom: wrap,
			selectNode() {
				codeMirrorView.focus();
			},
			stopEvent: (e: Event) => settings.stopEvent(e, node, getPos, view, dom),
			setSelection: (anchor, head) => {
				codeMirrorView.focus();
				forwardSelection(codeMirrorView, view, getPos);
				updating = true;
				codeMirrorView.dispatch({
					selection: { anchor, head },
				});
				updating = false;
			},
			update: (updateNode) => {
				if (updateNode.type.name !== node.type.name) return false;
				if (updateNode.attrs.lang !== node.attrs.lang)
					setMode(updateNode.attrs.lang, codeMirrorView, settings, languageConf);
				const oldNode = node;
				node = updateNode;
				const change = computeChange(codeMirrorView.state.doc.toString(), node.textContent);
				if (change) {
					updating = true;
					codeMirrorView.dispatch({
						changes: {
							from: change.from,
							to: change.to,
							insert: change.text,
						},
						selection: { anchor: change.from + change.text.length },
					});
					updating = false;
				}
				settings.updateSelect(settings, dom, updateNode, view, getPos, oldNode);
				return true;
			},
			ignoreMutation: () => true,
			destroy: () => {
				selectDeleteCB();
			},
		};
	};
};
