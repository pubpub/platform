import { mathPlugin } from "@benrbray/prosemirror-math";
import { exampleSetup } from "prosemirror-example-setup";
import { Schema } from "prosemirror-model";

import type { ContextEditorProps, PanelProps } from "../ContextEditor";
import attributePanel from "./attributePanel";
import code from "./code";
import contextSuggest from "./contextSuggest";
import inputRules from "./inputRules";
import keymap from "./keymap";
import onChange from "./onChange";
import pasteRules from "./pasteRules";
import reactProps from "./reactProps";
import structureDecorations from "./structureDecorations";

export const basePlugins = (
	schema: Schema,
	props: ContextEditorProps,
	panelPosition: PanelProps,
	setPanelPosition: React.Dispatch<React.SetStateAction<PanelProps>>,
	suggestData: any,
	setSuggestData: any
) => {
	return [
		keymap(schema),
		...contextSuggest(suggestData, setSuggestData),
		...exampleSetup({ schema, menuBar: false }),
		reactProps(props),
		structureDecorations(),
		attributePanel(panelPosition, setPanelPosition),
		onChange(),
		pasteRules(schema),
		inputRules(schema),
		mathPlugin,
		...code(schema, {}),
	];
};
