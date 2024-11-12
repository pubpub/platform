import type { EditorState } from "lexical";

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

import type { AutoFormInputComponentProps } from "../auto-form";
import AutoFormDescription from "../auto-form/common/description";
import AutoFormLabel from "../auto-form/common/label";
import AutoFormTooltip from "../auto-form/common/tooltip";
import { FormControl, FormItem, FormMessage } from "../form";
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

export const LexicalEditor = (
	props: AutoFormInputComponentProps & {
		withMarkdown?: boolean;
		/** If the size of the input should just be a single line. Will also prevent line breaks */
		singleLine?: boolean;
	}
) => {
	const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = props.fieldProps;
	const showLabel = _showLabel === undefined ? true : _showLabel;
	const { descriptionPlacement = "top" } = props;
	const initialValue = React.useMemo(() => props.field.value ?? "", []);
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
				fieldPropsWithoutShowLabel.onChange(makeSyntheticChangeEvent(markdown));
			});
		},
		[fieldPropsWithoutShowLabel.onChange]
	);

	const labelId = React.useId();

	return (
		<div className="flex flex-row items-center space-x-2">
			<FormItem className="flex w-full flex-col justify-start">
				{showLabel && (
					<>
						<AutoFormLabel
							id={labelId}
							label={props.label}
							isRequired={props.isRequired}
						/>
						{props.description && descriptionPlacement === "top" && (
							<AutoFormDescription description={props.description} />
						)}
					</>
				)}
				<LexicalComposer initialConfig={initialConfig}>
					<RichTextPlugin
						contentEditable={
							<FormControl>
								<ContentEditable
									ariaLabelledBy={labelId}
									className={cn(
										"editor",
										"prose prose-sm",
										props.singleLine ? "min-h-5" : "min-h-[200px]",
										// Copied from ui/src/input.tsx
										"w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									)}
								/>
							</FormControl>
						}
						placeholder={null}
						ErrorBoundary={LexicalErrorBoundary}
					/>
					<OnChangePlugin onChange={onChange} />
					<HistoryPlugin />
					<AutoFocusPlugin />
					{props.singleLine && <SingleLinePlugin />}
					{props.withMarkdown && <MarkdownShortcutPlugin transformers={TRANSFORMERS} />}
					<TokenPlugin tokens={Object.keys(tokens[props.field.name] ?? {})} />
				</LexicalComposer>
				<AutoFormTooltip fieldConfigItem={props.fieldConfigItem} />
				{props.description && descriptionPlacement === "bottom" && (
					<AutoFormDescription description={props.description} />
				)}
				<FormMessage />
			</FormItem>
		</div>
	);
};
