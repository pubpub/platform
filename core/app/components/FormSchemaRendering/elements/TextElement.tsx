"use client";

import { useFormContext } from "react-hook-form";

import type { InputProps } from "ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

export const TextElement = ({ label, name, ...rest }: ElementProps & InputProps) => {
	const { control } = useFormContext();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const { value, ...fieldRest } = field;
				return (
					<FormItem>
						<FormLabel>{label}</FormLabel>
						<FormControl>
							<Input value={value ?? ""} {...fieldRest} {...rest} />
						</FormControl>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
