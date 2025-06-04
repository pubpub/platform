"use client";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { selectDropdownConfigSchema } from "schemas";

import { CoreSchemaType, InputComponent } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

import type { InputElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";
import { getLabel } from "../utils";

export const SelectDropdownElement = (props: InputElementProps<InputComponent.selectDropdown>) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const label = getLabel(props);
	const isEnabled = formElementToggle.isEnabled(props.slug);
	const isNumeric = props.schemaName === CoreSchemaType.NumericArray;

	Value.Default(selectDropdownConfigSchema, props.config);
	if (!Value.Check(selectDropdownConfigSchema, props.config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={props.slug}
			render={({ field }) => {
				const handleChange = (value: string) => {
					field.onChange([isNumeric ? +value : value]);
				};
				return (
					<FormItem>
						<FormLabel className="flex">{label}</FormLabel>
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
								{props.config.values.map((value) => {
									return (
										<SelectItem value={`${value}`} key={value}>
											{value}
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
						<FormDescription>{props.config.help}</FormDescription>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
