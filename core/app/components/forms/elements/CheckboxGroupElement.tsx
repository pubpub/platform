"use client";

import { CoreSchemaType } from "@prisma/client";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { checkboxGroupConfigSchema } from "schemas";

import { Checkbox } from "ui/checkbox";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const CheckboxGroupElement = ({ name, config, schemaName }: ElementProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);
	const isNumeric = schemaName === CoreSchemaType.NumericArray;

	Value.Default(checkboxGroupConfigSchema, config);
	if (!Value.Check(checkboxGroupConfigSchema, config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={name}
			render={() => {
				return (
					<FormItem>
						<FormLabel>{config.label ?? name}</FormLabel>
						{config.values.map((v) => {
							return (
								<FormField
									key={v}
									control={control}
									name={name}
									render={({ field }) => {
										return (
											<FormItem
												className="flex items-center gap-2 space-y-0"
												key={v}
											>
												<FormControl>
													<Checkbox
														disabled={!isEnabled}
														checked={field.value?.includes(v)}
														onCheckedChange={(checked) => {
															return checked
																? field.onChange([
																		...field.value,
																		v,
																	])
																: field.onChange(
																		field.value?.filter(
																			(f: string | number) =>
																				f !== v
																		)
																	);
														}}
													/>
												</FormControl>
												<FormLabel>{v}</FormLabel>
											</FormItem>
										);
									}}
								/>
							);
						})}
						<FormDescription>{config.help}</FormDescription>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
