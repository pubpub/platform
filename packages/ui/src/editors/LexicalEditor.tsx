import type { EditorState } from "lexical";
import type { ControllerRenderProps } from "react-hook-form";

import * as React from "react";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
	$convertFromMarkdownString,
	$convertToMarkdownString,
	TRANSFORMERS,
} from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";

import { cn } from "utils";

import { useTokenContext } from "../tokens";
import { SingleLinePlugin } from "./SingleLinePlugin";
import { TokenNode } from "./TokenNode";
import { TokenPlugin } from "./TokenPlugin";

const theme = {
	token: "token",
};

function onError(error: unknown) {
	// eslint-disable-next-line no-console
	console.error(error);
}

const NODES = [
	HorizontalRuleNode,
	CodeNode,
	HeadingNode,
	LinkNode,
	ListNode,
	ListItemNode,
	QuoteNode,
	TokenNode,
];

const makeSyntheticChangeEvent = (value: string) => {
	return {
		target: {
			value,
		},
	};
};

export type LexicalEditorProps = ControllerRenderProps<any, string> & {
	withMarkdown?: boolean;
	singleLine?: boolean;
	"aria-labelledby"?: string;
};

export const LexicalEditor = (props: LexicalEditorProps) => {
	const initialValue = React.useMemo(() => props.value ?? "", []);
	const initialConfig = React.useMemo(() => {
		return {
			namespace: "LexicalEditor",
			theme,
			onError,
			editorState: () => $convertFromMarkdownString(initialValue, TRANSFORMERS),
			nodes: NODES,
		};
	}, [initialValue]);
	const tokens = useTokenContext();

	const onChange = React.useCallback(
		(editorState: EditorState) => {
			editorState.read(() => {
				const markdown = $convertToMarkdownString(TRANSFORMERS);
				props.onChange(makeSyntheticChangeEvent(markdown));
			});
		},
		[props.onChange]
	);

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<RichTextPlugin
				contentEditable={
					<ContentEditable
						id={props.name}
						ariaLabelledBy={props["aria-labelledby"]}
						className={cn(
							"editor",
							"prose prose-sm",
							props.singleLine ? "min-h-5" : "min-h-[200px]",
							// Copied from ui/src/input.tsx
							"w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						)}
					/>
				}
				placeholder={null}
				ErrorBoundary={LexicalErrorBoundary}
			/>
			<OnChangePlugin onChange={onChange} />
			<HistoryPlugin />
			<AutoFocusPlugin />
			{props.singleLine && <SingleLinePlugin />}
			{props.withMarkdown && <MarkdownShortcutPlugin transformers={TRANSFORMERS} />}
			<TokenPlugin tokens={Object.keys(tokens[props.name] ?? {})} />
		</LexicalComposer>
	);
};
