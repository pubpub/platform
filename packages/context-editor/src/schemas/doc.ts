import { NodeSpec } from "prosemirror-model";

export default {
	content: "block+",
	attrs: {
		meta: { default: {} },
	},
} satisfies NodeSpec;
