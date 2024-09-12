import { exampleSetup } from "prosemirror-example-setup";
import { Schema } from "prosemirror-model";

import { PanelProps } from "../ContextEditor";
import attributePanel from "./attributePanel";
import blockDecorations from "./blockDecorations";
// import inlineDecorations from "./inlineDecorations";

export const basePlugins = (
	schema: Schema,
	setPanelPosition: React.Dispatch<React.SetStateAction<PanelProps>>
) => {
	return [
		...exampleSetup({ schema, menuBar: false }),
		blockDecorations(),
		// inlineDecorations(),
		attributePanel(setPanelPosition),
	];
};
