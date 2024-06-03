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

import { cn } from "utils";

import { FormControl, FormItem, FormMessage } from "../../../form";
import AutoFormDescription from "../../common/description";
import AutoFormLabel from "../../common/label";
import AutoFormTooltip from "../../common/tooltip";
import { AutoFormInputComponentProps } from "../../types";
import { TokenProvider } from "./TokenContext";
import { TokenNode } from "./TokenNode";
import { TokenPlugin } from "./TokenPlugin";

const theme = {
	token: "token",
};

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
	TokenNode,
];

const makeSyntheticChangeEvent = (value: string) => {
	return {
		target: {
			value,
		},
	};
};

export const MarkdownEditor = (props: AutoFormInputComponentProps) => {
	const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = props.fieldProps;
	const showLabel = _showLabel === undefined ? true : _showLabel;
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
				fieldPropsWithoutShowLabel.onChange(makeSyntheticChangeEvent(markdown));
			});
		},
		[fieldPropsWithoutShowLabel.onChange]
	);

	return (
		<div className="flex flex-row items-center space-x-2">
			<FormItem className="flex w-full flex-col justify-start">
				{showLabel && (
					<>
						<AutoFormLabel label={props.label} isRequired={props.isRequired} />
						{props.description && (
							<AutoFormDescription description={props.description} />
						)}
					</>
				)}
				<TokenProvider
					staticTokens={[
						"user.token",
						"user.id",
						"user.firstName",
						"user.lastName",
						"instance.id",
					]}
					dynamicTokens={null}
				>
					<FormControl>
						<LexicalComposer initialConfig={initialConfig}>
							<RichTextPlugin
								contentEditable={
									<ContentEditable
										className={cn(
											"editor",
											"markdown",
											// Copied from ui/src/input.tsx
											"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										)}
									/>
								}
								placeholder={null}
								ErrorBoundary={LexicalErrorBoundary}
							/>
							<OnChangePlugin onChange={onChange} />
							<HistoryPlugin />
							<AutoFocusPlugin />
							<MarkdownShortcutPlugin transformers={TRANSFORMERS} />
							<TokenPlugin />
						</LexicalComposer>
					</FormControl>
					<AutoFormTooltip fieldConfigItem={props.fieldConfigItem} />
				</TokenProvider>
				<FormMessage />
			</FormItem>
		</div>
	);
};
