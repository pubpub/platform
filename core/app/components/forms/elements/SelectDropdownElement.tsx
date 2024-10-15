"use client";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { selectDropdownConfigSchema } from "schemas";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const SelectDropdownElement = ({ name, config }: ElementProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);

	Value.Default(selectDropdownConfigSchema, config);
	if (!Value.Check(selectDropdownConfigSchema, config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				return (
					<FormItem>
						<FormLabel className="flex">{config.label ?? name}</FormLabel>
						<Select
							onValueChange={field.onChange}
							defaultValue={field.value}
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
