"use client";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { checkboxConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import { Checkbox } from "ui/checkbox";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const CheckboxElement = ({ name, config }: ElementProps<InputComponent.checkbox>) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);

	Value.Default(checkboxConfigSchema, config);
	if (!Value.Check(checkboxConfigSchema, config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				return (
					<FormItem>
						<FormLabel className="flex">{config.groupLabel ?? name}</FormLabel>
						<div className="flex items-end gap-x-2">
							<FormControl>
								<Checkbox
									checked={
										field.value != undefined
											? Boolean(field.value)
											: config.defaultValue
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
							<FormLabel>{config.checkboxLabel}</FormLabel>
						</div>
						<FormDescription>{config.help}</FormDescription>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
