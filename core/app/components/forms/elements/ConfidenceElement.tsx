"use client";

import { forwardRef } from "react";
import dynamic from "next/dynamic";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { confidenceIntervalConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
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

// Workaround for forwarding refs to dynamic components
// https://github.com/vercel/next.js/issues/4957#issuecomment-413841689
const ForwardedRefConfidence = forwardRef<
	React.ElementRef<typeof Confidence>,
	React.ComponentPropsWithoutRef<typeof Confidence>
>((props, ref) => <Confidence {...props} forwardedRef={ref} />);

export const ConfidenceElement = ({
	slug,
	label,
	config,
}: ElementProps<InputComponent.confidenceInterval>) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(slug);

	if (!Value.Check(confidenceIntervalConfigSchema, config)) {
		return null;
	}

	return (
		<>
			<FormField
				control={control}
				name={slug}
				defaultValue={[0, 50, 100]}
				render={({ field }) => {
					// Need to pass the field's onChange as onValueChange in Confidence
					// and make sure it is not passed in as the default onChange
					const { onChange, ...fieldProps } = field;
					return (
						<FormItem className="mb-6">
							<FormLabel className="text-[0.9em]">{label}</FormLabel>
							<FormControl>
								<ForwardedRefConfidence
									{...fieldProps}
									disabled={!isEnabled}
									min={0}
									max={100}
									onValueChange={onChange}
									className="confidence"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					);
				}}
			/>
			<FormDescription>{config.help}</FormDescription>
		</>
	);
};
