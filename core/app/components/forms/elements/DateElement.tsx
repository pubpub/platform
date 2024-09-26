"use client";

import dynamic from "next/dynamic";
import { useFormContext } from "react-hook-form";

import { FormField, FormItem, FormLabel, FormMessage } from "ui/form";

const DatePicker = dynamic(async () => import("ui/date-picker").then((mod) => mod.DatePicker), {
	ssr: false,
	// TODO: add better loading state
	loading: () => <div>Loading...</div>,
});

export const DateElement = ({ label, name }: ElementProps) => {
	const { control } = useFormContext();
	return (
		<FormField
			name={name}
			control={control}
			render={({ field }) => (
				<FormItem className="grid gap-2">
					<FormLabel>{label}</FormLabel>
					<DatePicker date={field.value} setDate={(date) => field.onChange(date)} />
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
