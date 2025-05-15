import type { Mark, Node } from "prosemirror-model";

import { isNode } from "./nodes";

export const isMark = (node: Node | Mark): node is Mark => {
	return !isNode(node);
};
