"use client"

import type { InputComponent } from "db/public"
import type { ElementProps } from "../types"

import { Value } from "@sinclair/typebox/value"
import { useFormContext } from "react-hook-form"
import { colorPickerConfigSchema } from "schemas"

import { Button } from "ui/button"
import { ColorCircle, ColorPicker, ColorValue } from "ui/color"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover"
import { cn } from "utils"

import { useFormElementToggleContext } from "../FormElementToggleContext"

export const ColorPickerPopover = ({
	color,
	onChange,
	presets,
	presetsOnly,
}: {
	color: string
	onChange: (value: string) => void
	presets?: { label: string; value: string }[]
	presetsOnly?: boolean
}) => {
	const label = presets?.find((preset) => preset.value === color)?.label

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className="flex h-full items-center gap-2"
					data-testid="color-picker-button"
					aria-label={`Select color: currently ${label || color}`}
				>
					<span className="sr-only">Pick a color</span>
					<ColorCircle color={color} size="sm" />

					{label && <span>{label}</span>}
					<ColorValue
						color={color}
						className={cn(label && "text-muted-foreground text-xs")}
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="!border-0 w-auto overflow-clip border-transparent bg-transparent p-0 shadow-none"
				aria-label="Color picker"
				side="top"
			>
				<ColorPicker
					presets={presets}
					presetsOnly={presetsOnly}
					color={color}
					onChange={onChange}
				/>
			</PopoverContent>
		</Popover>
	)
}

export const ColorPickerElement = ({
	slug,
	label,
	config,
}: ElementProps<InputComponent.colorPicker>) => {
	const { control } = useFormContext()
	const _formElementToggle = useFormElementToggleContext()

	Value.Default(colorPickerConfigSchema, config)
	if (!Value.Check(colorPickerConfigSchema, config)) {
		return null
	}

	const defaultColor = config.presets?.length ? config.presets[0].value : "#000000"

	return (
		<FormField
			control={control}
			name={slug}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label || config.label}</FormLabel>
					<FormControl>
						<ColorPickerPopover
							color={field.value || defaultColor}
							onChange={(value) => {
								field.onChange(value)
							}}
							presets={config.presets}
							presetsOnly={config.presetsOnly}
						/>
					</FormControl>
					{config.help && <FormDescription>{config.help}</FormDescription>}
					<FormMessage />
				</FormItem>
			)}
		/>
	)
}
