"use client";

import { forwardRef } from "react";
import dynamic from "next/dynamic";
import { useFormContext } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

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

export const Vector3Element = ({ label, name }: ElementProps) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);

	return (
		<FormField
			control={control}
			name={name}
			defaultValue={[0, 0, 0]}
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
	);
};
