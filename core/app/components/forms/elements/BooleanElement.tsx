"use client";

import { useFormContext } from "react-hook-form";

import { Checkbox } from "ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

export const BooleanElement = ({ label, name }: ElementProps) => {
	const { control } = useFormContext();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				return (
					<FormItem>
						<div className="flex items-center gap-2">
							<FormControl>
								<Checkbox
									checked={Boolean(field.value)}
									onCheckedChange={(change) => {
										if (typeof change === "boolean") {
											field.onChange(change);
										}
									}}
									className="rounded"
								/>
							</FormControl>
							<FormLabel>{label}</FormLabel>
						</div>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
