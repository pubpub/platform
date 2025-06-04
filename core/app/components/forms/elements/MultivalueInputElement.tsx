"use client";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { multivalueInputConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import { CoreSchemaType } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { MultiValueInput } from "ui/multivalue-input";

import type { InputElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const MultivalueInputElement = (
	props: InputElementProps<InputComponent.multivalueInput>
) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(props.slug);
	const isNumeric = props.schemaName === CoreSchemaType.NumericArray;

	Value.Default(multivalueInputConfigSchema, props.config);
	if (!Value.Check(multivalueInputConfigSchema, props.config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={props.slug}
			render={({ field }) => {
				return (
					<FormItem>
						<FormLabel>{props.config.label}</FormLabel>
						<FormControl>
							<MultiValueInput
								disabled={!isEnabled}
								type={isNumeric ? "number" : undefined}
								{...field}
								value={field.value ?? []}
								onChange={(newValues) => {
									if (isNumeric) {
										field.onChange(newValues.map((v) => +v));
										return;
									}
									field.onChange(newValues);
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
