"use client";

import type { ChangeEvent } from "react";

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
			render={({ field }) => {
				const handleOtherField = (e: ChangeEvent<HTMLInputElement>) => {
					const configValues: (string | number)[] = config.values;
					const checkboxValues = field.value?.filter((f: string | number) =>
						configValues.includes(f)
					);
					const value = isNumeric ? e.target.valueAsNumber : e.target.value;
					const inputIsEmpty = value === "" || (isNumeric && isNaN(value as number));
					if (inputIsEmpty) {
						field.onChange(checkboxValues);
					} else {
						field.onChange([...checkboxValues, value]);
					}
				};
				return (
					<FormItem>
						<FormLabel>
							{config.label ?? name} {`${field.value}`}
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
						{config.includeOther ? (
							<FormItem className="flex items-center gap-2 space-y-0">
								<FormLabel>Other</FormLabel>
								<FormControl>
									<Input
										type={isNumeric ? "number" : undefined}
										className="h-6"
										onChange={handleOtherField}
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
