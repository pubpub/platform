"use client";

import { CoreSchemaType } from "@prisma/client";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { multivalueInputConfigSchema } from "schemas";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { MultiValueInput } from "ui/multivalue-input";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const MultivalueInputElement = ({ name, config, schemaName }: ElementProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);
	const isNumeric = schemaName === CoreSchemaType.NumericArray;

	Value.Default(multivalueInputConfigSchema, config);
	if (!Value.Check(multivalueInputConfigSchema, config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				return (
					<FormItem>
						<FormLabel>{config.label ?? name}</FormLabel>
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
						<FormDescription>{config.help}</FormDescription>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
