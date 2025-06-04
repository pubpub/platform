"use client";

import { useMemo, useState } from "react";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { radioGroupConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import { CoreSchemaType } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { RadioGroup, RadioGroupItem } from "ui/radio-group";

import type { InputElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";
import { getLabel } from "../utils";

export const RadioGroupElement = (props: InputElementProps<InputComponent.radioGroup>) => {
	const { control, getValues } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const label = getLabel(props);
	const isEnabled = formElementToggle.isEnabled(props.slug);
	const isNumeric = props.schemaName === CoreSchemaType.NumericArray;

	const initialOther = useMemo(() => {
		const initialValues: string[] | number[] = getValues()[props.slug];
		const other = initialValues.filter((iv) => !props.config.values.some((cv) => cv === iv));
		return other[0] ?? "";
	}, []);
	const [other, setOther] = useState<string | number>(initialOther);

	Value.Default(radioGroupConfigSchema, props.config);
	if (!Value.Check(radioGroupConfigSchema, props.config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={props.slug}
			render={({ field }) => {
				const handleRadioChange = (value: string) => {
					field.onChange([isNumeric ? +value : value]);
					setOther("");
				};
				return (
					<FormItem>
						<FormLabel className="flex">{label}</FormLabel>
						<FormControl>
							<RadioGroup
								onValueChange={handleRadioChange}
								defaultValue={
									Array.isArray(field.value) ? field.value[0] : undefined
								}
								disabled={!isEnabled}
								className="space-y-1"
							>
								{props.config.values.map((v) => {
									return (
										<FormItem
											className="flex items-center gap-2 space-y-0"
											key={v}
										>
											<FormControl>
												<RadioGroupItem
													checked={
														Array.isArray(field.value)
															? field.value.includes(v)
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
								{props.config.includeOther ? (
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
						<FormDescription>{props.config.help}</FormDescription>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
