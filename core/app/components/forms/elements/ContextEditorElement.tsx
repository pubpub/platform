"use client";

import type { ControllerRenderProps, FieldValues } from "react-hook-form";

import { memo, useMemo, useState } from "react";
import { Value } from "@sinclair/typebox/value";
import { EMPTY_DOC } from "context-editor";
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

const EditorFormElement = memo(
	function EditorFormElement({
		field,
		label,
		help,
	}: {
		field: ControllerRenderProps<FieldValues, string>;
		label: string;
		help?: string;
	}) {
		const formElementToggle = useFormElementToggleContext();
		const { pubs, pubTypes, pubId, pubTypeId } = useContextEditorContext();

		const f = useMemo(() => {
			return field;
		}, []);

		const [initialHtml] = useState(f.value);

		if (!pubId || !pubTypeId) {
			return <></>;
		}
		const disabled = !formElementToggle.isEnabled(f.name);

		return (
			<FormItem>
				<FormLabel className="flex">{label}</FormLabel>
				<div className="w-full">
					<FormControl>
						<ContextEditorClient
							pubId={pubId}
							pubs={pubs}
							pubTypes={pubTypes}
							pubTypeId={pubTypeId}
							onChange={(state, initialDoc, initialHtml) => {
								// Control changing the state more granularly or else the dirty field will trigger on load
								// Since we can't control the dirty state directly, even this workaround does not handle the case of
								// if someone changes the doc but then reverts it--that will still count as dirty since react-hook-form is tracking that
								const hasChanged = docHasChanged(initialDoc ?? EMPTY_DOC, state);
								if (hasChanged) {
									f.onChange(serializeProseMirrorDoc(state.doc));
								}
							}}
							initialHtml={initialHtml}
							disabled={disabled}
							className="max-h-96 overflow-scroll"
						/>
					</FormControl>
				</div>
				<FormDescription>{help}</FormDescription>
				<FormMessage />
			</FormItem>
		);
	},
	(prevProps, nextProps) => {
		// delete prevProps.field;
		// delete nextProps.field;
		return true;
	}
);

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
			render={({ field }) => (
				<EditorFormElement field={field} label={label} help={config.help} />
			)}
		/>
	);
};
