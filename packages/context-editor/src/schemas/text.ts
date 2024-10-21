import { NodeSpec } from "prosemirror-model";

export default {
	inline: true,
	group: "inline",
	toDOM: (node) => {
		return node.text!;
	},
} satisfies NodeSpec;
