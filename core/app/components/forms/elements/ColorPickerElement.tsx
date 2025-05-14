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
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="flex h-full items-center gap-2"
									aria-label={`Select color: currently ${field.value || "#000000"}`}
								>
									<span className="sr-only">Pick a color</span>
									<ColorCircle color={field.value || "#000000"} size="sm" />
									<ColorValue color={field.value || "#000000"} />
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className="w-auto overflow-clip p-0"
								aria-label="Color picker"
							>
								<ColorPicker
									color={field.value || "#000000"}
									onChange={(value) => {
										field.onChange(value);
									}}
								/>
							</PopoverContent>
						</Popover>
					</FormControl>
					{config.help && <FormDescription>{config.help}</FormDescription>}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
