import React from "react";
import { useNodeViewContext } from "@prosemirror-adapter/react";

export default function ContextAtom({ nodeProp }) {
	const { contentRef, node, selected } = useNodeViewContext();
	const goodNode = nodeProp || node;
	if (!goodNode) {
		return null;
	}
	// console.log('ContextAtom', node, nodeProp)
	return (
		<section
			style={{ outline: selected ? "1px solid #777" : "none" }}
			role="presentation"
			ref={contentRef}
		>
			{goodNode.attrs.data?.type === "image" && <img src={goodNode.attrs.data.src} />}
			{/* goodNode.attrs.data?.type !== "image" &&  */ JSON.stringify(goodNode, null, 2)}
		</section>
	);
}
