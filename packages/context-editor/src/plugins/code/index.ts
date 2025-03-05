/**
 * Based on https://gitlab.com/emergence-engineering/prosemirror-codemirror-block/-/blob/main/src/index.ts
 *
 * Differences:
 * * Adds createSelect
 * * Exports default with options
 * * No theme
 * */

import { redo, undo } from "prosemirror-history";
import { Node, Schema } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import type { CodeBlockSettings, LanguageLoaders } from "./types";
import { codeMirrorBlockNodeView } from "./codeMirrorBlockNodeView";
import { defaultSettings } from "./defaults";
import languageLoaders from "./languageLoaders";
import { CodeBlockLanguages } from "./languages";
import { codeBlockArrowHandlers } from "./utils";

export const codeMirrorBlockKey = new PluginKey("codemirror-block");

const codeMirrorBlockPlugin = (settings: CodeBlockSettings) => {
	return new Plugin({
		key: codeMirrorBlockKey,
		props: {
			nodeViews: {
				// @ts-expect-error Type FIXME: '(pmNode: Node, view: PMEditorView, getPos: (() => number) | boolean) => NodeView' is not assignable to type 'NodeViewConstructor'.
				code_block: codeMirrorBlockNodeView(settings),
			},
		},
	});
};

export {
	codeMirrorBlockNodeView,
	codeBlockArrowHandlers,
	codeMirrorBlockPlugin,
	type CodeBlockSettings,
	type LanguageLoaders,
	CodeBlockLanguages,
	defaultSettings,
	languageLoaders,
};

const createSelect = (
	settings: CodeBlockSettings,
	dom: HTMLElement,
	node: Node,
	view: EditorView,
	getPos: (() => number) | boolean
) => {
	if (!settings.languageLoaders) return () => {};
	const wrapper = document.createElement("div");
	wrapper.classList.add("codeblock-select-wrapper");

	const select = document.createElement("select");
	const carets = document.createElement("span");

	wrapper.append(select);
	wrapper.append(carets);
	select.className = "codeblock-select";
	const noneOption = document.createElement("option");
	noneOption.value = "none";
	noneOption.textContent = settings.languageNameMap?.none || "none";
	select.append(noneOption);
	Object.keys(languageLoaders)
		.sort()
		.forEach((lang) => {
			if (settings.languageWhitelist && !settings.languageWhitelist.includes(lang)) return;
			const option = document.createElement("option");
			option.value = lang;
			option.textContent = settings.languageNameMap?.[lang] || lang;
			select.append(option);
		});
	select.value = node.attrs.lang || "none";
	dom.prepend(wrapper);
	select.onchange = async (e) => {
		if (!(e.target instanceof HTMLSelectElement)) return;
		const lang = e.target.value === "none" ? null : e.target.value;
		if (typeof getPos === "function") {
			view.dispatch(
				view.state.tr.setNodeMarkup(
					getPos(),
					undefined,
					{
						...node.attrs,
						lang,
					},
					node.marks
				)
			);
		}
	};
	return () => {};
};

// Legacy has a bunch of plugin options—only using isReadOnly for now and not setting anywhere yet
export default (schema: Schema, pluginsOptions: { isReadOnly?: boolean }) => {
	if (schema.nodes.code_block) {
		return [
			codeMirrorBlockPlugin({
				...defaultSettings,
				readOnly: !!pluginsOptions.isReadOnly,
				createSelect,
				languageLoaders,
				undo,
				redo,
			}),
		];
	}
	return [];
};
