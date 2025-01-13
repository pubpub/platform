import { useCallback, useEffect, useMemo } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useLexicalTextEntity } from "@lexical/react/useLexicalTextEntity"
import { TextNode } from "lexical"

import { $createTokenNode, TokenNode } from "./TokenNode"

const boundary = "^|$|[^&/" + "*" + "]"

const $createTokenNode_ = (textNode: TextNode): TokenNode => {
	return $createTokenNode(textNode.getTextContent())
}

type Props = {
	tokens: string[]
}

const getRegex = (tokens: string[]) => {
	return new RegExp(`(^|$|[^&/.*])\\:(${tokens.join("|")})(\\[.*?\\])?(\\{.*?\\})?`, "i")
}

export function TokenPlugin(props: Props) {
	const [editor] = useLexicalComposerContext()
	const REGEX = useMemo(() => getRegex(props.tokens), [props.tokens])

	useEffect(() => {
		if (!editor.hasNodes([TokenNode])) {
			throw new Error("TokenPlugin: TokenNode not registered on editor")
		}
	}, [editor])

	const getTokenMatch = useCallback((text: string) => {
		const match = REGEX.exec(text)
		if (match === null) {
			return null
		}
		const length =
			// directive name
			match[2].length +
			// add one for the colon
			1 +
			// content
			(match[3]?.length ?? 0) +
			// attributes
			(match[4]?.length ?? 0)
		const start = match.index + match[1].length
		const end = start + length
		return { start, end }
	}, [])

	useLexicalTextEntity<TokenNode>(getTokenMatch, TokenNode, $createTokenNode_)

	return null
}
