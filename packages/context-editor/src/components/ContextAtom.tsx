import React from "react";
import { useNodeViewContext } from "@prosemirror-adapter/react";

export default function ContextAtom() {
	const { contentRef, node, selected } = useNodeViewContext();

	return (
		<section
			style={{ outline: selected ? "1px solid #777" : "none" }}
			role="presentation"
			ref={contentRef}
		>
			{node.attrs.data.type === "image" && <img src={node.attrs.data.src} />}
			{node.attrs.data.type !== "image" && JSON.stringify({ node }, null, 2)}
		</section>
	);
}
