import type { NodeSpec } from "prosemirror-model";

export default {
	content: "block+",
	attrs: {
		id: { default: null },
		class: { default: null },
	},
} satisfies NodeSpec;
