import type { EditorConfig, LexicalNode, NodeKey, SerializedTextNode } from "lexical"

import { addClassNamesToElement } from "@lexical/utils"
import { $applyNodeReplacement, TextNode } from "lexical"

export class TokenNode extends TextNode {
	static getType(): string {
		return "token"
	}

	static clone(node: TokenNode): TokenNode {
		return new TokenNode(node.__text, node.__key)
	}

	constructor(text: string, key?: NodeKey) {
		super(text, key)
	}

	createDOM(config: EditorConfig): HTMLElement {
		const element = super.createDOM(config)
		addClassNamesToElement(element, config.theme.token)
		return element
	}

	static importJSON(serializedNode: SerializedTextNode): TokenNode {
		const node = $createTokenNode(serializedNode.text)
		node.setFormat(serializedNode.format)
		node.setDetail(serializedNode.detail)
		node.setMode(serializedNode.mode)
		node.setStyle(serializedNode.style)
		return node
	}

	exportJSON(): SerializedTextNode {
		return {
			...super.exportJSON(),
			type: "token",
		}
	}

	canInsertTextBefore(): boolean {
		return false
	}

	isTextEntity(): true {
		return true
	}
}

export function $createTokenNode(text = ""): TokenNode {
	return $applyNodeReplacement(new TokenNode(text))
}

export function $isTokenNode(node: LexicalNode | null | undefined): node is TokenNode {
	return node instanceof TokenNode
}
