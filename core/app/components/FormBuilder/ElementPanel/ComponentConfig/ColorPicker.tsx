import { PlusIcon, TrashIcon } from "lucide-react";

import type { InputComponent } from "db/public";
import { Button } from "ui/button";
import { Checkbox } from "ui/checkbox";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

import type { ComponentConfigFormProps } from "./types";
import { ColorPickerPopover } from "~/app/components/forms/elements/ColorPickerElement";

export default ({ form }: ComponentConfigFormProps<InputComponent.colorPicker>) => {
	return (
		<>
			<FormField
				control={form.control}
				name="config.label"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Label</FormLabel>
						<FormControl>
							<Input placeholder="Color selection label" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="config.help"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Help Text</FormLabel>
						<FormControl>
							<Input placeholder="Optional guidance for color selection" {...field} />
						</FormControl>
						<FormDescription>Appears below the color picker</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="config.presets"
				render={({ field }) => (
					<FormItem className="flex flex-col gap-2">
						<FormLabel>Color Presets</FormLabel>
						{field.value?.map((preset, idx) => (
							<FormField
								key={idx}
								control={form.control}
								name={`config.presets.${idx}`}
								render={({ field: subField }) => (
									<div className="flex flex-row items-center gap-2">
										<ColorPickerPopover
											color={subField.value}
											onChange={(value) => {
												subField.onChange(value);
											}}
										/>
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												field.onChange(
													field.value?.filter((_, i) => i !== idx)
												);
											}}
										>
											<TrashIcon className="h-4 w-4" />
										</Button>
									</div>
								)}
							/>
						))}

						<Button
							type="button"
							variant="outline"
							className="mt-2"
							onClick={() => {
								const currentPresets = field.value ?? [];
								field.onChange([...currentPresets, "#000000"]);
							}}
						>
							<PlusIcon className="mr-2 h-4 w-4" />
							Add Color Preset
						</Button>
						<FormDescription>
							Provide preset color options for users to select from
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="config.presetsOnly"
				render={({ field }) => (
					<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
						<FormControl>
							<Checkbox checked={field.value} onCheckedChange={field.onChange} />
						</FormControl>
						<div className="space-y-1 leading-none">
							<FormLabel>Presets Only</FormLabel>
							<FormDescription>
								When enabled, users can only select from preset colors
							</FormDescription>
						</div>
					</FormItem>
				)}
			/>
		</>
	);
};
