"use client";

import { useState } from "react";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { colorPickerConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import { Button } from "ui/button";
import { ColorCircle, ColorPicker, ColorValue } from "ui/color";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const ColorPickerPopover = ({
	color,
	onChange,
	presets,
	presetsOnly,
}: {
	color: string;
	onChange: (value: string) => void;
	presets?: string[];
	presetsOnly?: boolean;
}) => {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className="flex h-full items-center gap-2"
					aria-label={`Select color: currently ${color || "#000000"}`}
				>
					<span className="sr-only">Pick a color</span>
					<ColorCircle color={color || "#000000"} size="sm" />
					<ColorValue color={color || "#000000"} />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto overflow-clip p-0" aria-label="Color picker">
				<ColorPicker
					presets={presets}
					presetsOnly={presetsOnly}
					color={color}
					onChange={(value) => {
						onChange(value);
					}}
				/>
			</PopoverContent>
		</Popover>
	);
};

export const ColorPickerElement = ({
	slug,
	label,
	config,
}: ElementProps<InputComponent.colorPicker>) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(slug);

	Value.Default(colorPickerConfigSchema, config);
	if (!Value.Check(colorPickerConfigSchema, config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={slug}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label || config.label}</FormLabel>
					<FormControl>
						<ColorPickerPopover
							color={field.value || "#000000"}
							onChange={(value) => {
								field.onChange(value);
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
	);
};
