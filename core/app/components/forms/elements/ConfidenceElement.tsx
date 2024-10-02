"use client";

import dynamic from "next/dynamic";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { confidenceIntervalConfigSchema } from "schemas";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

const Confidence = dynamic(
	async () => import("ui/customRenderers/confidence/confidence").then((mod) => mod.Confidence),
	{
		ssr: false,
		// TODO: add better loading state
		loading: () => <div>Loading...</div>,
	}
);

export const ConfidenceElement = ({ name, config }: ElementProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);

	if (!Value.Check(confidenceIntervalConfigSchema, config)) {
		return null;
	}

	return (
		<>
			<FormField
				control={control}
				name={name}
				defaultValue={[0, 50, 100]}
				render={({ field }) => (
					<FormItem className="mb-6">
						<FormLabel className="text-[0.9em]">{config.label ?? name}</FormLabel>
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
			<FormDescription>{config.help}</FormDescription>
		</>
	);
};
