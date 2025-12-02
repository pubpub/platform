import type { InitialConfigType } from "@lexical/react/LexicalComposer"
import type { EditorState } from "lexical"
import type { ControllerRenderProps } from "react-hook-form"

import * as React from "react"
import { $convertFromMarkdownString } from "@lexical/markdown"
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin"
import { $getRoot } from "lexical"

import { cn } from "utils"

import { JsonataNode } from "./JsonataNode"
import { JsonataPlugin } from "./JsonataPlugin"
import { SingleLinePlugin } from "./SingleLinePlugin"

const theme = {
	token: "token",
	jsonataToken: "jsonata-token",
}

function onError(_error: unknown) {}

const NODES = [JsonataNode]

const makeSyntheticChangeEvent = (value: string) => {
	return {
		target: {
			value,
		},
	}
}

export type PlainTextWithTokensEditorProps = ControllerRenderProps<
	Record<string, string>,
	string
> & {
	multiLine?: boolean
	"aria-labelledby"?: string
}

export const PlainTextWithTokensEditor = (props: PlainTextWithTokensEditorProps) => {
	const initialValue = React.useMemo(() => props.value ?? "", [props.value])
	const initialConfig = React.useMemo(() => {
		return {
			namespace: "LexicalEditor",
			theme,
			onError,
			editorState: () => $convertFromMarkdownString(initialValue),
			nodes: NODES,
		} satisfies InitialConfigType
	}, [initialValue])

	const onChange = React.useCallback(
		(editorState: EditorState) => {
			editorState.read(() => {
				props.onChange(makeSyntheticChangeEvent($getRoot().getTextContent()))
			})
		},
		[props.onChange]
	)

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<PlainTextPlugin
				contentEditable={
					<ContentEditable
						id={props.name}
						ariaLabelledBy={props["aria-labelledby"]}
						className={cn(
							"editor",
							"prose prose-sm",
							props.multiLine ? "min-h-[200px]" : "min-h-9",
							// Copied from ui/src/input.tsx
							"flex w-full min-w-0 items-center rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
							"focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
							"aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
						)}
					/>
				}
				placeholder={null}
				ErrorBoundary={LexicalErrorBoundary}
			/>
			<OnChangePlugin onChange={onChange} />
			<HistoryPlugin />
			<AutoFocusPlugin />
			{!props.multiLine && <SingleLinePlugin />}
			<JsonataPlugin />
		</LexicalComposer>
	)
}
