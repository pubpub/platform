"use client";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { textAreaConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import type { TextareaProps } from "ui/textarea";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Textarea } from "ui/textarea";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const TextAreaElement = ({
	slug,
	label,
	config,
	schemaName,
	...rest
}: ElementProps<InputComponent.textArea> & TextareaProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(slug);
	if (!Value.Check(textAreaConfigSchema, config)) {
		return null;
	}
	return (
		<FormField
			control={control}
			name={slug}
			render={({ field }) => {
				const { value, ...fieldRest } = field;
				return (
					<FormItem>
						<FormLabel disabled={!isEnabled}>{label}</FormLabel>{" "}
						<FormControl>
							<Textarea
								maxLength={config.maxLength}
								minLength={config.minLength}
								placeholder={config.placeholder}
								data-testid={slug}
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
