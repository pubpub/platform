"use client";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { textAreaConfigSchema } from "schemas";

import type { TextareaProps } from "ui/textarea";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Textarea } from "ui/textarea";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const TextAreaElement = ({ name, config, ...rest }: ElementProps & TextareaProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);
	if (!Value.Check(textAreaConfigSchema, config)) {
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
						<FormLabel disabled={!isEnabled}>{config.label}</FormLabel>{" "}
						<FormControl>
							<Textarea
								maxLength={config.maxLength}
								minLength={config.minLength}
								placeholder={config.placeholder}
								data-testid={name}
								value={value ?? ""}
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
