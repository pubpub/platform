"use client";

import type { ChangeEvent } from "react";

import { useMemo, useState } from "react";
import { Value } from "@sinclair/typebox/value";
import partition from "lodash.partition";
import { useFormContext } from "react-hook-form";
import { checkboxGroupConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import { CoreSchemaType } from "db/public";
import { Checkbox } from "ui/checkbox";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

import type { InputElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";
import { getLabel } from "../utils";

export const CheckboxGroupElement = (props: InputElementProps<InputComponent.checkboxGroup>) => {
	const { control, getValues } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(props.slug);
	const isNumeric = props.schemaName === CoreSchemaType.NumericArray;
	const label = getLabel(props);

	// Keep track of what was checked via checkboxes so as not to duplicate with Other field
	const { initialChecked, initialOther } = useMemo(() => {
		const initialValues: (string | number)[] = getValues()[props.slug];
		const [initialChecked, initialOther] = partition(initialValues, (v) => {
			return props.config.values.some((cv) => cv === v);
		});
		return { initialChecked, initialOther: initialOther[0] ?? "" };
	}, []);
	const [checked, setChecked] = useState<(string | number)[]>(initialChecked);
	const [other, setOther] = useState<string | number>(initialOther);

	Value.Default(checkboxGroupConfigSchema, props.config);
	if (!Value.Check(checkboxGroupConfigSchema, props.config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={props.slug}
			render={({ field }) => {
				const handleOtherField = (e: ChangeEvent<HTMLInputElement>) => {
					const value = isNumeric ? e.target.valueAsNumber : e.target.value;
					if (checked.includes(value)) {
						setOther(value);
						return;
					}
					const inputIsEmpty = value === "" || (isNumeric && isNaN(value as number));
					if (inputIsEmpty) {
						setOther("");
						field.onChange(checked);
					} else {
						setOther(value);
						field.onChange([...checked, value]);
					}
				};
				return (
					<FormItem>
						<FormLabel>{label}</FormLabel>
						{props.config.values.map((v) => {
							return (
								<FormField
									key={v}
									control={control}
									name={`${props.slug}`}
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
						{props.config.includeOther ? (
							<FormItem className="flex items-center gap-2 space-y-0">
								<FormLabel>Other</FormLabel>
								<FormControl>
									<Input
										type={isNumeric ? "number" : undefined}
										className="h-6"
										onChange={handleOtherField}
										data-testid="other-field"
										disabled={!isEnabled}
										value={other}
									/>
								</FormControl>
							</FormItem>
						) : null}
						<FormDescription>{props.config.help}</FormDescription>
						<FormMessage data-testid="error-message" />
					</FormItem>
				);
			}}
		/>
	);
};
