"use client";

import type { Node } from "prosemirror-model";

import { useMemo } from "react";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { richTextInputConfigSchema } from "schemas";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { ElementProps } from "../types";
import { ContextEditorClient } from "../../ContextEditor/ContextEditorClient";
import { useContextEditorContext } from "../../ContextEditor/ContextEditorContext";
import { useFormElementToggleContext } from "../FormElementToggleContext";

const EditorFormElement = ({
	label,
	help,
	onChange,
	initialValue,
}: {
	label: string;
	help?: string;
	onChange: (state: any) => void;
	initialValue?: Node;
}) => {
	const { pubs, pubTypes, pubId, pubTypeId } = useContextEditorContext();
	const memoEditor = useMemo(() => {
		if (!pubTypeId) {
			// throw error? does editor require pubTypeId?
			// or it might mean we are using this component without the context setup
			return null;
		}
		return (
			<ContextEditorClient
				pubId={pubId}
				pubs={pubs}
				pubTypes={pubTypes}
				pubTypeId={pubTypeId}
				onChange={onChange}
				initialDoc={initialValue}
			/>
		);
	}, [onChange]);

	return (
		<FormItem>
			<FormLabel className="flex">{label}</FormLabel>
			<div className="w-full">
				<FormControl>{memoEditor}</FormControl>
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
					/>
				);
			}}
		/>
	);
};
