"use client";

import dynamic from "next/dynamic";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { datePickerConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { InputElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";
import { getLabel } from "../utils";

const DatePicker = dynamic(async () => import("ui/date-picker").then((mod) => mod.DatePicker), {
	ssr: false,
	// TODO: add better loading state
	loading: () => <div>Loading...</div>,
});

export const DateElement = (props: InputElementProps<InputComponent.datePicker>) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(props.slug);

	const label = getLabel(props);
	if (!Value.Check(datePickerConfigSchema, props.config)) {
		return null;
	}

	return (
		<FormField
			name={props.slug}
			control={control}
			render={({ field }) => (
				<FormItem className="grid gap-2">
					<FormLabel>{label}</FormLabel>
					<DatePicker
						disabled={!isEnabled}
						date={field.value}
						setDate={(date) => field.onChange(date)}
					/>
					<FormDescription>{props.config.help}</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
