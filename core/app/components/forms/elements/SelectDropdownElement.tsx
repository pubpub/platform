"use client";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { selectDropdownConfigSchema } from "schemas";

import { CoreSchemaType } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const SelectDropdownElement = ({ name, config, schemaName }: ElementProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);
	const isNumeric = schemaName === CoreSchemaType.NumericArray;

	Value.Default(selectDropdownConfigSchema, config);
	if (!Value.Check(selectDropdownConfigSchema, config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const handleChange = (value: string) => {
					field.onChange([isNumeric ? +value : value]);
				};
				return (
					<FormItem>
						<FormLabel className="flex">{config.label ?? name}</FormLabel>
						<Select
							onValueChange={handleChange}
							defaultValue={
								Array.isArray(field.value) ? `${field.value[0]}` : undefined
							}
							disabled={!isEnabled}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{config.values.map((value) => {
									return (
										<SelectItem value={`${value}`} key={value}>
											{value}
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
						<FormDescription>{config.help}</FormDescription>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
