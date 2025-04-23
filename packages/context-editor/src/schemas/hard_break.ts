import type { DOMOutputSpec, NodeSpec } from "prosemirror-model";

export default {
	inline: true,
	group: "inline",
	selectable: false,
	parseDOM: [{ tag: "br" }],
	toDOM: () => {
		return ["br"] as DOMOutputSpec;
	},
} satisfies NodeSpec;
