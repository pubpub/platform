"use client"

import type { InputComponent } from "db/public"
import type { ElementProps } from "../types"

import dynamic from "next/dynamic"
import { Value } from "@sinclair/typebox/value"
import { useFormContext } from "react-hook-form"
import { confidenceIntervalConfigSchema } from "schemas"

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { Skeleton } from "ui/skeleton"
import { Slider } from "ui/slider"

import { useFormElementToggleContext } from "../FormElementToggleContext"

const _Confidence = dynamic(
	async () => import("ui/customRenderers/confidence/confidence").then((mod) => mod.Confidence),
	{
		ssr: false,
		// TODO: add better loading state
		loading: () => <Skeleton className="relative h-2 w-full" />,
	}
)

export const ConfidenceElement = ({
	slug,
	label,
	config,
}: ElementProps<InputComponent.confidenceInterval>) => {
	const { control } = useFormContext()
	const formElementToggle = useFormElementToggleContext()
	const isEnabled = formElementToggle.isEnabled(slug)

	if (!Value.Check(confidenceIntervalConfigSchema, config)) {
		return null
	}

	return (
		<>
			<FormField
				control={control}
				name={slug}
				render={({ field }) => {
					// Need to pass the field's onChange as onValueChange in Confidence
					// and make sure it is not passed in as the default onChange
					const { onChange, ...fieldProps } = field
					return (
						<FormItem className="relative mb-6">
							<FormLabel className="text-[0.9em]">{label}</FormLabel>
							<FormControl>
								<Slider
									{...fieldProps}
									// Make sure null becomes undefined so that defaultValue can kick in
									value={field.value == null ? undefined : field.value}
									defaultValue={[0, 50, 100]}
									disabled={!isEnabled}
									min={0}
									max={100}
									onValueChange={onChange}
									className="confidence mb-6"
									withThumbLabels="always"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)
				}}
			/>
			{config.help && <FormDescription>{config.help}</FormDescription>}
		</>
	)
}
