import type { LexicalEditorProps } from "./LexicalEditor"

import { LexicalEditor } from "./LexicalEditor"

export const MarkdownEditor = (props: LexicalEditorProps) => {
	return <LexicalEditor {...props} withMarkdown />
}

export const InputWithTokens = (props: LexicalEditorProps) => {
	return <LexicalEditor {...props} singleLine />
}

export { LexicalEditor } from "./LexicalEditor"
export { PlainTextWithTokensEditor } from "./PlainTextWithTokensEditor"
