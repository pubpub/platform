"use client";

import type { Node } from "prosemirror-model";

import { useMemo, useState } from "react";
import { Value } from "@sinclair/typebox/value";
import { docHasChanged } from "context-editor";
import { useFormContext } from "react-hook-form";
import { richTextInputConfigSchema } from "schemas";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { ElementProps } from "../types";
import { ContextEditorClient } from "../../ContextEditor/ContextEditorClient";
import { useContextEditorContext } from "../../ContextEditor/ContextEditorContext";
import { useFormElementToggleContext } from "../FormElementToggleContext";

const EMPTY_DOC = {
	type: "doc",
	attrs: {
		meta: {},
	},
	content: [
		{
			type: "paragraph",
			attrs: {
				id: null,
				class: null,
			},
		},
	],
};

const EditorFormElement = ({
	label,
	help,
	onChange,
	initialValue,
	disabled,
}: {
	label: string;
	help?: string;
	onChange: (state: any) => void;
	initialValue?: Node;
	disabled?: boolean;
}) => {
	const { pubs, pubTypes, pubId, pubTypeId } = useContextEditorContext();
	const [initialDoc] = useState(initialValue);

	return (
		<FormItem>
			<FormLabel className="flex">{label}</FormLabel>
			<div className="w-full">
				<FormControl>
					{pubTypeId ? (
						<ContextEditorClient
							pubId={pubId}
							pubs={pubs}
							pubTypes={pubTypes}
							pubTypeId={pubTypeId}
							onChange={(state) => {
								// Control changing the state more granularly or else the dirty field will trigger on load
								// Since we can't control the dirty state directly, even this workaround does not handle the case of
								// if someone changes the doc but then reverts it--that will still count as dirty since react-hook-form is tracking that
								const hasChanged = docHasChanged(initialDoc ?? EMPTY_DOC, state);
								if (hasChanged) {
									onChange(state);
								}
							}}
							initialDoc={initialDoc}
							disabled={disabled}
						/>
					) : null}
				</FormControl>
			</div>
			<FormDescription>{help}</FormDescription>
			<FormMessage />
		</FormItem>
	);
};

export const ContextEditorElement = ({ name, config }: ElementProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);

	Value.Default(richTextInputConfigSchema, config);
	if (!Value.Check(richTextInputConfigSchema, config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				return (
					<EditorFormElement
						label={config.label ?? name}
						help={config.help}
						onChange={(state) => field.onChange(state.doc)}
						initialValue={field.value}
						disabled={!isEnabled}
					/>
				);
			}}
		/>
	);
};
