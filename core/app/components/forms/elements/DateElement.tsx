"use client";

import dynamic from "next/dynamic";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { datePickerConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Skeleton } from "ui/skeleton";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

const DatePicker = dynamic(async () => import("ui/date-picker").then((mod) => mod.DatePicker), {
	ssr: false,
	// TODO: add better loading state
	loading: () => <Skeleton className="h-9 w-full" />,
});

export const DateElement = ({ slug, label, config }: ElementProps<InputComponent.datePicker>) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(slug);

	if (!Value.Check(datePickerConfigSchema, config)) {
		return null;
	}

	return (
		<FormField
			name={slug}
			control={control}
			render={({ field }) => (
				<FormItem className="[&>button]:!my-1">
					<FormLabel>{label}</FormLabel>
					<DatePicker
						disabled={!isEnabled}
						date={field.value}
						setDate={(date) => field.onChange(date)}
					/>
					{config.help && <FormDescription>{config.help}</FormDescription>}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
