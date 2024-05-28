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
import { EditorState } from "lexical";

import { AutoFormInputComponentProps } from "../../types";

const theme = {};

function onError(error: unknown) {
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
];

const makeSyntheticChangeEvent = (value: string) => {
	return {
		target: {
			value,
		},
	};
};

export const MarkdownEditor = (props: AutoFormInputComponentProps) => {
	const initialValue = React.useMemo(() => props.field.value ?? "", []);
	const initialConfig = React.useMemo(() => {
		return {
			namespace: "MarkdownEditor",
			theme,
			onError,
			editorState: () => $convertFromMarkdownString(initialValue, TRANSFORMERS),
			nodes: NODES,
		};
	}, [initialValue]);

	const onChange = React.useCallback(
		(editorState: EditorState) => {
			editorState.read(() => {
				const markdown = $convertToMarkdownString(TRANSFORMERS);
				props.fieldProps.onChange(makeSyntheticChangeEvent(markdown));
			});
		},
		[props.fieldProps.onChange]
	);

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<RichTextPlugin
				contentEditable={<ContentEditable />}
				placeholder={<div>Enter some text...</div>}
				ErrorBoundary={LexicalErrorBoundary}
			/>
			<OnChangePlugin onChange={onChange} />
			<HistoryPlugin />
			<AutoFocusPlugin />
			<MarkdownShortcutPlugin transformers={TRANSFORMERS} />
		</LexicalComposer>
	);
};
