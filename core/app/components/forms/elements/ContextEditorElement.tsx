"use client";

import type { Node } from "prosemirror-model";

import { useState } from "react";
import { Value } from "@sinclair/typebox/value";
import { docHasChanged } from "context-editor/utils";
import { useFormContext } from "react-hook-form";
import { richTextInputConfigSchema } from "schemas";

import { InputComponent } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { ElementProps } from "../types";
import { serializeProseMirrorDoc } from "~/lib/fields/richText";
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

	if (!pubId || !pubTypeId) {
		return null;
	}

	return (
		<FormItem>
			<FormLabel className="flex">{label}</FormLabel>
			<div className="max-h-96 w-full overflow-scroll">
				<FormControl>
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
				</FormControl>
			</div>
			<FormDescription>{help}</FormDescription>
			<FormMessage />
		</FormItem>
	);
};

export const ContextEditorElement = ({
	slug,
	label,
	config,
}: ElementProps<InputComponent.richText>) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(slug);

	Value.Default(richTextInputConfigSchema, config);
	if (!Value.Check(richTextInputConfigSchema, config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={slug}
			render={({ field }) => {
				return (
					<EditorFormElement
						label={label}
						help={config.help}
						onChange={(state) => {
							field.onChange(serializeProseMirrorDoc(state.doc));
						}}
						initialValue={field.value}
						disabled={!isEnabled}
					/>
				);
			}}
		/>
	);
};
