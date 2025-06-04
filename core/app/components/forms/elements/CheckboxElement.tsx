"use client";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { checkboxConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import { Checkbox } from "ui/checkbox";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { InputElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";
import { getLabel } from "../utils";

export const CheckboxElement = (props: InputElementProps<InputComponent.checkbox>) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(props.slug);
	const label = getLabel(props);

	Value.Default(checkboxConfigSchema, props.config);
	if (!Value.Check(checkboxConfigSchema, props.config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={props.slug}
			render={({ field }) => {
				return (
					<FormItem>
						<FormLabel className="flex">{label}</FormLabel>
						<div className="flex items-end gap-x-2">
							<FormControl>
								<Checkbox
									checked={
										field.value != undefined
											? Boolean(field.value)
											: props.config.defaultValue
									}
									disabled={!isEnabled}
									onCheckedChange={(change) => {
										if (typeof change === "boolean") {
											field.onChange(change);
										}
									}}
									className="rounded"
								/>
							</FormControl>
							<FormLabel>{props.config.checkboxLabel}</FormLabel>
						</div>
						<FormDescription>{props.config.help}</FormDescription>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
