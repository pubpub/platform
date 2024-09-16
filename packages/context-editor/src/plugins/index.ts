import { exampleSetup } from "prosemirror-example-setup";
import { Schema } from "prosemirror-model";

import { ContextEditorProps, PanelProps } from "../ContextEditor";
import attributePanel from "./attributePanel";
import structureDecorations from "./structureDecorations";
import reactProps from "./reactProps";

export const basePlugins = (
	schema: Schema,
	props: ContextEditorProps,
	setPanelPosition: React.Dispatch<React.SetStateAction<PanelProps>>
) => {
	return [
		...exampleSetup({ schema, menuBar: false }),
		reactProps(props),
		structureDecorations(),
		attributePanel(setPanelPosition),
	];
};
