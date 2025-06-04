"use client";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { textInputConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import type { InputProps } from "ui/input";
import { CoreSchemaType } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

import type { InputElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";
import { getLabel } from "../utils";

export const TextInputElement = (props: InputElementProps<InputComponent.textInput>) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const type = props.schemaName === CoreSchemaType.Number ? "number" : undefined;
	const label = getLabel(props);
	const isEnabled = formElementToggle.isEnabled(props.slug);
	if (!Value.Check(textInputConfigSchema, props.config)) {
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
						<FormLabel disabled={!isEnabled}>{label}</FormLabel>
						<FormControl>
							<Input
								data-testid={props.slug}
								value={value ?? ""}
								placeholder={props.config.placeholder}
								{...fieldRest}
								// {...rest}
								type={type}
								disabled={!isEnabled}
								onChange={(e) => {
									field.onChange(
										type === "number" ? Number(e.target.value) : e.target.value
									);
								}}
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
