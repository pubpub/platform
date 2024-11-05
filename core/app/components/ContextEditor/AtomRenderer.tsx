import { useState } from "react";
import { useNodeViewContext } from "@prosemirror-adapter/react";
import { Node } from "prosemirror-model";

export const ContextAtom = ({ nodeProp }: { nodeProp: Node }) => {
	const { contentRef, node, selected } = useNodeViewContext();
	const [activeData, setActiveData] = useState("");
	const activeNode = nodeProp || node;
	// console.log({ activeNode });
	if (!activeNode) {
		return null;
	}
	return "TODO";
};
