"use client";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { textInputConfigSchema } from "schemas";

import type { InputProps } from "ui/input";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const TextInputElement = ({
	name,
	config,
	schemaName,
	...rest
}: ElementProps & InputProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);
	if (!Value.Check(textInputConfigSchema, config)) {
		return null;
	}
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const { value, ...fieldRest } = field;
				return (
					<FormItem>
						<FormLabel disabled={!isEnabled}>{config.label ?? name}</FormLabel>
						<FormControl>
							<Input
								data-testid={name}
								value={value ?? ""}
								placeholder={config.placeholder}
								{...fieldRest}
								{...rest}
								disabled={!isEnabled}
							/>
						</FormControl>
						<FormDescription>{config.help}</FormDescription>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
