import { exampleSetup } from "prosemirror-example-setup";
import { Schema } from "prosemirror-model";
import { ContextEditorProps, PanelProps } from "../ContextEditor";
import attributePanel from "./attributePanel";
import reactProps from "./reactProps";
import structureDecorations from "./structureDecorations";
import contextSuggest from "./contextSuggest";

export const basePlugins = (
	schema: Schema,
	props: ContextEditorProps,
	panelPosition: PanelProps,
	setPanelPosition: React.Dispatch<React.SetStateAction<PanelProps>>,
	suggestData: any,
	setSuggestData: any,
) => {
	return [
		...contextSuggest(suggestData, setSuggestData),
		...exampleSetup({ schema, menuBar: false }),
		reactProps(props),
		structureDecorations(),
		attributePanel(panelPosition, setPanelPosition),	
	];
};
