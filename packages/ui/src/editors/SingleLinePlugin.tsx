import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { LineBreakNode, RootNode } from "lexical";

// From https://github.com/facebook/lexical/issues/3675
export const SingleLinePlugin = () => {
	const [editor] = useLexicalComposerContext();
	useEffect(
		() =>
			mergeRegister(
				editor.registerNodeTransform(RootNode, (rootNode: RootNode) => {
					if (rootNode.getChildrenSize() <= 1) return;
					rootNode.getLastChild()?.remove();
				}),
				editor.registerNodeTransform(LineBreakNode, (node) => {
					node.remove();
				})
			),
		[editor]
	);
	return null;
};
