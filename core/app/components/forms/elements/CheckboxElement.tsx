"use client";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { checkboxConfigSchema } from "schemas";

import { Checkbox } from "ui/checkbox";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const CheckboxElement = ({ name, config }: ElementProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);

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
						<div className="flex items-center gap-2">
							<FormControl>
								<FormLabel>{config.groupLabel}</FormLabel>
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
								>
									{config.checkboxLabel}
								</Checkbox>
							</FormControl>
						</div>
						<FormDescription>{config.help}</FormDescription>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
