"use client";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { textAreaConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Textarea } from "ui/textarea";

import type { InputElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";
import { getLabel } from "../utils";

export const TextAreaElement = (props: InputElementProps<InputComponent.textArea>) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const label = getLabel(props);
	const isEnabled = formElementToggle.isEnabled(props.slug);
	if (!Value.Check(textAreaConfigSchema, props.config)) {
		return null;
	}
	return (
		<FormField
			control={control}
			name={props.slug}
			render={({ field }) => {
				const { value, ...fieldRest } = field;
				return (
					<FormItem>
						<FormLabel disabled={!isEnabled}>{label}</FormLabel>{" "}
						<FormControl>
							<Textarea
								maxLength={props.config.maxLength}
								minLength={props.config.minLength}
								placeholder={props.config.placeholder}
								data-testid={props.slug}
								value={value ?? ""}
								{...fieldRest}
								disabled={!isEnabled}
							/>
						</FormControl>
						<FormDescription>{props.config.help}</FormDescription>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
