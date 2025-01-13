import React from "react"

import type { AutoFormInputComponentProps } from "../auto-form"
import { LexicalEditor } from "./LexicalEditor"

export const MarkdownEditor = (props: AutoFormInputComponentProps) => {
	return <LexicalEditor {...props} withMarkdown />
}

export const InputWithTokens = (props: AutoFormInputComponentProps) => {
	return <LexicalEditor {...props} singleLine />
}

export { LexicalEditor } from "./LexicalEditor"
