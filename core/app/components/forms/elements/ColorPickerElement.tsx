"use client";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { colorPickerConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import { Button } from "ui/button";
import { ColorPicker } from "ui/color";
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
								>
									<div
										className="block h-4 w-4 rounded-full"
										style={{ backgroundColor: field.value || "#000000" }}
									></div>
									<span className="font-mono">{field.value || "#000000"}</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent>
								<ColorPicker
									color={field.value || "#000000"}
									onChange={(value) => {
										field.onChange(value);
										// formElementToggle.toggle(slug);
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
