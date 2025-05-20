"use client";

import type { ContextEditorRef } from "context-editor";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Value } from "@sinclair/typebox/value";
import { baseSchema } from "context-editor/schemas";
import { Node } from "prosemirror-model";
import { useFormContext } from "react-hook-form";
import { richTextInputConfigSchema } from "schemas";

import { InputComponent } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { ElementProps } from "../types";
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
		const { pubs, pubTypes, pubId, pubTypeId, registerGetter } = useContextEditorContext();

		const f = useMemo(() => {
			return field;
		}, []);

		const contextEditorRef = useRef<ContextEditorRef>(null);

		useEffect(() => {
			registerGetter(f.name, contextEditorRef);
		}, []);

		const initialDoc = useMemo(() => {
			if (f.value instanceof Node) {
				return f.value;
			}

			return baseSchema.nodeFromJSON(f.value);
		}, []);

		const form = useFormContext();

		const handleChange = useCallback(() => {
			// we are simply manually setting the value to _something_ to make the field dirty
			form.setValue(f.name, "some stupid value that really should be handled manually", {
				shouldDirty: true,
				shouldTouch: true,
			});
		}, []);

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
							ref={contextEditorRef}
							pubId={pubId}
							pubs={pubs}
							pubTypes={pubTypes}
							pubTypeId={pubTypeId}
							initialDoc={initialDoc}
							disabled={disabled}
							className="max-h-96 overflow-scroll"
							onChange={handleChange}
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
