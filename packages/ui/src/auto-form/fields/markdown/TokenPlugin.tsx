import { useCallback, useEffect, useMemo } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalTextEntity } from "@lexical/react/useLexicalTextEntity";
import { TextNode } from "lexical";

import { useTokenContext } from "./TokenContext";
import { $createTokenNode, TokenNode } from "./TokenNode";

const boundary = "^|$|[^&/" + "*" + "]";

const $createTokenNode_ = (textNode: TextNode): TokenNode => {
	return $createTokenNode(textNode.getTextContent());
};

export function TokenPlugin() {
	const [editor] = useLexicalComposerContext();
	const { staticTokens, dynamicTokens } = useTokenContext();

	const REGEX = useMemo(
		() => new RegExp(`(${boundary})\{(${staticTokens.join("|")})\}`, "i"),
		[staticTokens]
	);

	useEffect(() => {
		if (!editor.hasNodes([TokenNode])) {
			throw new Error("TokenPlugin: TokenNode not registered on editor");
		}
	}, [editor]);

	const getTokenMatch = useCallback((text: string) => {
		const matchArr = REGEX.exec(text);

		if (matchArr === null) {
			return null;
		}

		const tokenLength = matchArr[2].length + 2; // add two for the curly braces
		const startOffset = matchArr.index + matchArr[1].length;
		const endOffset = startOffset + tokenLength;

		return {
			end: endOffset,
			start: startOffset,
		};
	}, []);

	useLexicalTextEntity<TokenNode>(getTokenMatch, TokenNode, $createTokenNode_);

	return null;
}
