import type { EditorConfig, LexicalNode, SerializedTextNode } from "lexical"

import { addClassNamesToElement } from "@lexical/utils"
import { $applyNodeReplacement, TextNode } from "lexical"

export class JsonataNode extends TextNode {
	static getType(): string {
		return "jsonata"
	}

	static clone(node: JsonataNode): JsonataNode {
		return new JsonataNode(node.__text, node.__key)
	}

	createDOM(config: EditorConfig): HTMLElement {
		const element = super.createDOM(config)
		addClassNamesToElement(element, config.theme.jsonataToken)
		return element
	}

	static importJSON(serializedNode: SerializedTextNode): JsonataNode {
		const node = $createJsonataNode(serializedNode.text)
		node.setFormat(serializedNode.format)
		node.setDetail(serializedNode.detail)
		node.setMode(serializedNode.mode)
		node.setStyle(serializedNode.style)
		return node
	}

	exportJSON(): SerializedTextNode {
		return {
			...super.exportJSON(),
			type: "jsonata",
		}
	}

	canInsertTextBefore(): boolean {
		return false
	}

	isTextEntity(): true {
		return true
	}
}

export function $createJsonataNode(text = ""): JsonataNode {
	return $applyNodeReplacement(new JsonataNode(text))
}

export function $isJsonataNode(node: LexicalNode | null | undefined): node is JsonataNode {
	return node instanceof JsonataNode
}
