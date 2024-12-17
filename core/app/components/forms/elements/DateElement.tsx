"use client";

import dynamic from "next/dynamic";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { datePickerConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

const DatePicker = dynamic(async () => import("ui/date-picker").then((mod) => mod.DatePicker), {
	ssr: false,
	// TODO: add better loading state
	loading: () => <div>Loading...</div>,
});

export const DateElement = ({ name, config }: ElementProps<InputComponent.datePicker>) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);

	if (!Value.Check(datePickerConfigSchema, config)) {
		return null;
	}

	return (
		<FormField
			name={name}
			control={control}
			render={({ field }) => (
				<FormItem className="grid gap-2">
					<FormLabel>{config.label ?? name}</FormLabel>
					<DatePicker
						disabled={!isEnabled}
						date={field.value ?? new Date()}
						setDate={(date) => field.onChange(date)}
					/>
					<FormDescription>{config.help}</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
