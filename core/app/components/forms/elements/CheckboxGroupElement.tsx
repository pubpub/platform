"use client";

import type { ChangeEvent } from "react";

import { useState } from "react";
import { CoreSchemaType } from "@prisma/client";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { checkboxGroupConfigSchema } from "schemas";

import { Checkbox } from "ui/checkbox";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const CheckboxGroupElement = ({ name, config, schemaName }: ElementProps) => {
	const { control, getValues } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);
	const isNumeric = schemaName === CoreSchemaType.NumericArray;

	// Keep track of what was checked via checkboxes so as not to duplicate with Other field
	const [checked, setChecked] = useState<(string | number)[]>(getValues()[name]);

	Value.Default(checkboxGroupConfigSchema, config);
	if (!Value.Check(checkboxGroupConfigSchema, config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const handleOtherField = (e: ChangeEvent<HTMLInputElement>) => {
					const value = isNumeric ? e.target.valueAsNumber : e.target.value;
					if (checked.includes(value)) {
						return;
					}
					const inputIsEmpty = value === "" || (isNumeric && isNaN(value as number));
					if (inputIsEmpty) {
						field.onChange(checked);
					} else {
						field.onChange([...checked, value]);
					}
				};
				return (
					<FormItem>
						<FormLabel>
							{config.label ?? name} {field.value.join(",")}
						</FormLabel>
						{config.values.map((v) => {
							return (
								<FormField
									key={v}
									control={control}
									name={name}
									render={() => {
										return (
											<FormItem
												className="flex items-center gap-2 space-y-0"
												key={v}
											>
												<FormControl>
													<Checkbox
														data-testid={`checkbox-${v}`}
														disabled={!isEnabled}
														checked={field.value?.includes(v)}
														onCheckedChange={(isChecked) => {
															const newValues = isChecked
																? [...field.value, v]
																: field.value?.filter(
																		(f: string | number) =>
																			f !== v
																	);
															const newCheckedValues = isChecked
																? [...checked, v]
																: checked.filter((f) => f !== v);
															setChecked(newCheckedValues);
															field.onChange(newValues);
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
						{config.includeOther ? (
							<FormItem className="flex items-center gap-2 space-y-0">
								<FormLabel>Other</FormLabel>
								<FormControl>
									<Input
										type={isNumeric ? "number" : undefined}
										className="h-6"
										onChange={handleOtherField}
										data-testid="other-field"
										disabled={!isEnabled}
									/>
								</FormControl>
							</FormItem>
						) : null}
						<FormDescription>{config.help}</FormDescription>
						<FormMessage data-testid="error-message" />
					</FormItem>
				);
			}}
		/>
	);
};
