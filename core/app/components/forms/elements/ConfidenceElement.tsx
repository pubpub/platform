"use client";

import dynamic from "next/dynamic";
import { useFormContext } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import { useFormElementToggleContext } from "../FormElementToggleContext";

const Confidence = dynamic(
	async () => import("ui/customRenderers/confidence/confidence").then((mod) => mod.Confidence),
	{
		ssr: false,
		// TODO: add better loading state
		loading: () => <div>Loading...</div>,
	}
);

export const Vector3Element = ({ label, name }: ElementProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);

	return (
		<FormField
			control={control}
			name={name}
			defaultValue={[0, 0, 0]}
			render={({ field }) => (
				<FormItem className="mb-6">
					<FormLabel className="text-[0.9em]">{label}</FormLabel>
					<FormControl>
						<Confidence
							{...field}
							disabled={!isEnabled}
							min={0}
							max={100}
							onValueChange={(event) => field.onChange(event)}
							className="confidence"
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
