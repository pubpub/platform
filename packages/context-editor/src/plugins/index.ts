import type { Schema } from "prosemirror-model"
import type { ContextEditorProps, SuggestProps } from "../ContextEditor"

import { mathPlugin } from "@benrbray/prosemirror-math"
import { exampleSetup } from "prosemirror-example-setup"
import { columnResizing, tableEditing } from "prosemirror-tables"

import code from "./code"
import contextSuggest from "./contextSuggest"
import inputRules from "./inputRules"
import keymap from "./keymap"
import pasteRules from "./pasteRules"
import reactProps from "./reactProps"
import structureDecorations from "./structureDecorations"

export const basePlugins = (
	schema: Schema,
	props: ContextEditorProps,
	suggestData: SuggestProps,
	setSuggestData: React.Dispatch<React.SetStateAction<SuggestProps>>
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
		columnResizing(),
		tableEditing(),
	]
}
