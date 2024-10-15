"use client";

import { useState } from "react";
import { CoreSchemaType } from "@prisma/client";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { radioGroupConfigSchema } from "schemas";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { RadioGroup, RadioGroupItem } from "ui/radio-group";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const RadioGroupElement = ({ name, config, schemaName }: ElementProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);
	const isNumeric = schemaName === CoreSchemaType.NumericArray;

	const [other, setOther] = useState<string | number>("");

	Value.Default(radioGroupConfigSchema, config);
	if (!Value.Check(radioGroupConfigSchema, config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const handleRadioChange = (value: string) => {
					field.onChange([isNumeric ? +value : value]);
					setOther("");
				};
				return (
					<FormItem>
						<FormLabel className="flex">{config.label ?? name}</FormLabel>
						<FormControl>
							<RadioGroup
								onValueChange={handleRadioChange}
								defaultValue={
									Array.isArray(field.value) ? field.value[0] : undefined
								}
								disabled={!isEnabled}
								className="space-y-1"
							>
								{config.values.map((v) => {
									return (
										<FormItem
											className="flex items-center gap-2 space-y-0"
											key={v}
										>
											<FormControl>
												<RadioGroupItem
													checked={
														Array.isArray(field.value)
															? field.value[0] === v
															: false
													}
													value={`${v}`}
													data-testid={`radio-${v}`}
												/>
											</FormControl>
											<FormLabel>{v}</FormLabel>
										</FormItem>
									);
								})}
								{config.includeOther ? (
									<FormItem className="flex items-center gap-2 space-y-0">
										<FormLabel>Other</FormLabel>
										<FormControl>
											<Input
												type={isNumeric ? "number" : undefined}
												className="h-6"
												value={other}
												disabled={!isEnabled}
												onChange={(e) => {
													const { value, valueAsNumber } = e.target;
													let v: string | number = value;
													if (isNumeric) {
														if (isNaN(valueAsNumber)) {
															setOther("");
															field.onChange([]);
															return;
														}
														v = valueAsNumber;
													}

													setOther(v);
													field.onChange([v]);
												}}
												data-testid="other-field"
											/>
										</FormControl>
									</FormItem>
								) : null}
							</RadioGroup>
						</FormControl>
						<FormDescription>{config.help}</FormDescription>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
