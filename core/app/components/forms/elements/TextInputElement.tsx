"use client"

import type { InputComponent } from "db/public"
import type { InputProps } from "ui/input"
import type { ElementProps } from "../types"

import { Value } from "@sinclair/typebox/value"
import { useFormContext } from "react-hook-form"
import { textInputConfigSchema } from "schemas"

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { Input } from "ui/input"

import { useFormElementToggleContext } from "../FormElementToggleContext"

export const TextInputElement = ({
	config,
	schemaName,
	slug,
	label,
	...rest
}: ElementProps<InputComponent.textInput> & InputProps) => {
	const { control } = useFormContext()
	const formElementToggle = useFormElementToggleContext()
	const isEnabled = formElementToggle.isEnabled(slug)
	if (!Value.Check(textInputConfigSchema, config)) {
		return null
	}

	return (
		<FormField
			control={control}
			name={slug}
			render={({ field }) => {
				const { value, ...fieldRest } = field
				return (
					<FormItem>
						<FormLabel disabled={!isEnabled}>{label}</FormLabel>
						<FormControl>
							<Input
								data-testid={slug}
								value={value ?? ""}
								placeholder={config.placeholder}
								{...fieldRest}
								{...rest}
								disabled={!isEnabled}
								onChange={(e) => {
									field.onChange(
										rest.type === "number"
											? Number(e.target.value)
											: e.target.value
									)
								}}
							/>
						</FormControl>
						{config.help && <FormDescription>{config.help}</FormDescription>}
						<FormMessage />
					</FormItem>
				)
			}}
		/>
	)
}
