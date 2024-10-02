"use client";

import { useFormContext } from "react-hook-form";

import type { InputProps } from "ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const TextElement = ({ label, name, ...rest }: ElementProps & InputProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const { value, ...fieldRest } = field;
				return (
					<FormItem>
						<FormLabel disabled={!isEnabled}>{label}</FormLabel>
						<FormControl>
							<Input
								data-testid={name}
								value={value ?? ""}
								{...fieldRest}
								{...rest}
								disabled={!isEnabled}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
