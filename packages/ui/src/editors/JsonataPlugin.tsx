import { useCallback, useEffect, useMemo } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalTextEntity } from "@lexical/react/useLexicalTextEntity";
import {
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_NORMAL,
	KEY_DOWN_COMMAND,
	TextNode,
} from "lexical";

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

	// register {{ autocomplete
	useEffect(() => {
		return editor.registerCommand(
			KEY_DOWN_COMMAND,
			(event: KeyboardEvent) => {
				if (event.key !== "{") {
					return false;
				}

				const selection = $getSelection();
				if (!$isRangeSelection(selection)) {
					return false;
				}

				const anchorNode = selection.anchor.getNode();
				if (!(anchorNode instanceof TextNode)) {
					return false;
				}

				const textContent = anchorNode.getTextContent();
				const offset = selection.anchor.offset;

				if (offset === 0) {
					return false;
				}

				if (textContent[offset - 1] !== "{") {
					return false;
				}

				event.preventDefault();

				editor.update(() => {
					const sel = $getSelection();
					if (!$isRangeSelection(sel)) {
						return;
					}

					// insert '{  }}' (one opening brace, two spaces, two closing braces)
					sel.insertText("{  }}");

					// move cursor back 3 positions to be between two spaces and }}
					const newSel = $getSelection();
					if ($isRangeSelection(newSel)) {
						const node = newSel.anchor.getNode();
						if (node instanceof TextNode) {
							const newOffset = newSel.anchor.offset;
							newSel.setTextNodeRange(node, newOffset - 3, node, newOffset - 3);
						}
					}
				});

				return true;
			},
			COMMAND_PRIORITY_NORMAL
		);
	}, [editor]);

	return null;
}
