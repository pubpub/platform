"use client";

import { CoreSchemaType } from "@prisma/client";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { radioGroupConfigSchema } from "schemas";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { RadioGroup, RadioGroupItem } from "ui/radio-group";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const RadioGroupElement = ({ name, config, schemaName }: ElementProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);
	const isNumeric = schemaName === CoreSchemaType.NumericArray;

	Value.Default(radioGroupConfigSchema, config);
	if (!Value.Check(radioGroupConfigSchema, config)) {
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
						<FormControl>
							<RadioGroup
								onValueChange={(v) => field.onChange([isNumeric ? +v : v])}
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
												<RadioGroupItem value={`${v}`} />
											</FormControl>
											<FormLabel>{v}</FormLabel>
										</FormItem>
									);
								})}
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
