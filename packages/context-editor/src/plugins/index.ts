import type { PluginViewSpec, WidgetDecorationFactory } from "@prosemirror-adapter/core";
import type { ReactPluginViewUserOptions } from "@prosemirror-adapter/react";

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

export const basePlugins = ({
	schema,
	props,
	panelPosition,
	setPanelPosition,
	suggestData,
	setSuggestData,
	getToggleWidget,
	pluginViewFactory,
}: {
	schema: Schema;
	props: ContextEditorProps;
	panelPosition: PanelProps;
	setPanelPosition: React.Dispatch<React.SetStateAction<PanelProps>>;
	suggestData: any;
	setSuggestData: any;
	getToggleWidget: WidgetDecorationFactory;
	pluginViewFactory: (options: ReactPluginViewUserOptions) => PluginViewSpec;
}) => {
	return [
		...contextSuggest(suggestData, setSuggestData),
		// Example setup includes inputRules for headers, blockquotes, codeblock, lists
		// https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/inputrules.ts
		...exampleSetup({ schema, menuBar: false }),
		reactProps(props),
		...attributePanel(panelPosition, setPanelPosition, getToggleWidget, pluginViewFactory),
		onChange(),
		pasteRules(schema),
		inputRules(schema),
		mathPlugin,
		...code(schema, {}),
		keymap(schema),
	];
};
