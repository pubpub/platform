"use client";

import type { ContextEditorGetter } from "context-editor";
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

/**
 * Symbol to use in lieu of the real value for the context editor, to signal that this value should not be used
 * and should be manually read instead
 */
export const EvilContextEditorSymbol = Symbol("EvilContextEditor");

/**
 * Brief explanation of what's going on here:
 *
 * Contraints:
 * - Constantly doing `field.onChange(giganticProsemirrorDoc)` is quite slow
 * - We still want to be able to use `formState.isDirty` to determine if the form has been changed
 *
 * Solution:
 * - Don't use `field.onChange`, instead manually read the value from the context editor using the `contextEditorRef`,
 * see the body of `packages/context-editor/src/ContextEditor.tsx` for how this is implemented (using `useImperativeHandle`)
 * - To force `react-hook-form` to see the field as dirty, we set the value to a custom symbol. this way, it can never be equal to the default value, and any change will count as "dirty" (even if you revert it, which is fine)
 */
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

		const contextEditorRef = useRef<ContextEditorGetter>(null);

		useEffect(() => {
			registerGetter(f.name, contextEditorRef);
		}, []);

		const initialDoc = useMemo(() => {
			if (f.value instanceof Node) {
				return f.value;
			}

			if (!f.value) {
				return;
			}

			return baseSchema.nodeFromJSON(f.value);
		}, []);

		const form = useFormContext();

		const handleChange = useCallback(() => {
			// we are simply manually setting the value to _something_ to make the field dirty
			form.setValue(f.name, EvilContextEditorSymbol, {
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
							getterRef={contextEditorRef}
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
