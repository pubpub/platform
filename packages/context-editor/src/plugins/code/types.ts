/**
 * Based on https://gitlab.com/emergence-engineering/prosemirror-codemirror-block/-/blob/main/src/types.ts
 * Differences:
 * * Added Parser type
 * * No copy button
 * * No themes, getCurrentTheme, or codeBlockName
 */

import type { sql } from "@codemirror/lang-sql";
import type { LanguageSupport, LRLanguage } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import type { LRParser } from "@lezer/lr";
import type { MarkdownParser } from "@lezer/markdown";
import type { Node } from "prosemirror-model";
import type { EditorState, Transaction } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

import { CodeBlockLanguages } from "./languages";

type LanguageName = (typeof CodeBlockLanguages)[number];

export type LanguageLoaders = Record<LanguageName, () => Promise<LanguageSupport>>;

type SQLParser = ReturnType<typeof sql>["language"]["parser"];
export type Parsers = Record<
	LanguageName[number],
	LRLanguage["parser"] | LRParser | MarkdownParser | SQLParser
>;

export type CodeBlockSettings = {
	createSelect: (
		settings: CodeBlockSettings,
		dom: HTMLElement,
		node: Node,
		view: EditorView,
		getPos: (() => number) | boolean
	) => () => void;
	updateSelect: (
		settings: CodeBlockSettings,
		dom: HTMLElement,
		node: Node,
		view: EditorView,
		getPos: (() => number) | boolean,
		oldNode: Node
	) => void;
	stopEvent: (
		e: Event,
		node: Node,
		getPos: (() => number) | boolean,
		view: EditorView,
		dom: HTMLElement
	) => boolean;
	languageLoaders?: LanguageLoaders;
	languageNameMap?: Record<string, string>;
	languageWhitelist?: string[];
	undo?: (state: EditorState, dispatch: (tr: Transaction) => void) => void;
	redo?: (state: EditorState, dispatch: (tr: Transaction) => void) => void;
	theme?: Extension[];
	readOnly: boolean;
};
