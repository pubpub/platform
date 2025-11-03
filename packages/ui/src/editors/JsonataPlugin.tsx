import { useCallback, useEffect, useMemo } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalTextEntity } from "@lexical/react/useLexicalTextEntity";
import { TextNode } from "lexical";

import { $createJsonataNode, JsonataNode } from "./JsonataNode";

const $createJsonataNode_ = (textNode: TextNode): JsonataNode => {
	return $createJsonataNode(textNode.getTextContent());
};

const REGEX = new RegExp(`(\{\{.*?\}\})`, "i");

export function JsonataPlugin() {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		if (!editor.hasNodes([JsonataNode])) {
			throw new Error("JsonataPlugin: JsonataNode not registered on editor");
		}
	}, [editor]);

	const getTokenMatch = useCallback((text: string) => {
		const match = REGEX.exec(text);
		if (match === null) {
			return null;
		}
		const start = match.index;
		const end = start + match[1].length;
		return { start, end };
	}, []);

	useLexicalTextEntity<JsonataNode>(getTokenMatch, JsonataNode, $createJsonataNode_);

	return null;
}
