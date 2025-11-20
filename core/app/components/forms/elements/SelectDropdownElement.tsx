"use client"

import type { ElementProps } from "../types"

import { Value } from "@sinclair/typebox/value"
import { useFormContext } from "react-hook-form"
import { selectDropdownConfigSchema } from "schemas"

import { CoreSchemaType, type InputComponent } from "db/public"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select"

import { useFormElementToggleContext } from "../FormElementToggleContext"

export const SelectDropdownElement = ({
	slug,
	label,
	config,
	schemaName,
}: ElementProps<InputComponent.selectDropdown>) => {
	const { control } = useFormContext()
	const formElementToggle = useFormElementToggleContext()
	const isEnabled = formElementToggle.isEnabled(slug)
	const isNumeric = schemaName === CoreSchemaType.NumericArray

	Value.Default(selectDropdownConfigSchema, config)
	if (!Value.Check(selectDropdownConfigSchema, config)) {
		return null
	}

	return (
		<FormField
			control={control}
			name={slug}
			render={({ field }) => {
				const handleChange = (value: string) => {
					field.onChange([isNumeric ? +value : value])
				}
				return (
					<FormItem>
						<FormLabel className="flex">{label}</FormLabel>
						<Select
							onValueChange={handleChange}
							defaultValue={
								Array.isArray(field.value) ? `${field.value[0]}` : undefined
							}
							disabled={!isEnabled}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{config.values.map((value) => {
									return (
										<SelectItem value={`${value}`} key={value}>
											{value}
										</SelectItem>
									)
								})}
							</SelectContent>
						</Select>
						{config.help && <FormDescription>{config.help}</FormDescription>}
						<FormMessage />
					</FormItem>
				)
			}}
		/>
	)
}
