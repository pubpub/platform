import { mathPlugin } from "@benrbray/prosemirror-math";
import { exampleSetup } from "prosemirror-example-setup";
import { Schema } from "prosemirror-model";
import { tableEditing } from "prosemirror-tables";

import type { ContextEditorProps } from "../ContextEditor";
import code from "./code";
import contextSuggest from "./contextSuggest";
import inputRules from "./inputRules";
import keymap from "./keymap";
import pasteRules from "./pasteRules";
import reactProps from "./reactProps";
import structureDecorations from "./structureDecorations";

export const basePlugins = (
	schema: Schema,
	props: ContextEditorProps,
	suggestData: any,
	setSuggestData: any
) => {
	return [
		keymap(schema),
		...contextSuggest(suggestData, setSuggestData),
		// Example setup includes inputRules for headers, blockquotes, codeblock, lists
		// https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/inputrules.ts
		...exampleSetup({ schema, menuBar: false }),
		reactProps(props),
		structureDecorations(),
		pasteRules(schema),
		inputRules(schema),
		mathPlugin,
		...code(schema, {}),
		tableEditing(),
	];
};
