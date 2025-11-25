import type { InputComponent } from "db/public";
import { Pencil, PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import { Button } from "ui/button";
import { Checkbox } from "ui/checkbox";
import { ColorCircle, ColorPicker } from "ui/color";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { Input } from "ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { cn } from "utils";

import type { ComponentConfigFormProps, ConfigFormData } from "./types";

export const FormBuilderColorPickerPopover = ({
	color,
	onChange,
	presets,
	presetsOnly,
	label,
	parentField,
	idx,
}: {
	color: string;
	label: string;
	onChange: (value: { label: string; value: string }) => void;
	presets?: { label: string; value: string }[];
	presetsOnly?: boolean;
	parentField: ControllerRenderProps<
		ConfigFormData<InputComponent.colorPicker>,
		"config.presets"
	>;
	idx: number;
}) => {
	const [isEditingLabel, setIsEditingLabel] = useState(false);

	const saveLabelChange = (newLabel: string) => {
		onChange({
			label: newLabel,
			value: color,
		});
		setIsEditingLabel(false);
	};

	return (
		<div className="group flex w-full min-w-0 items-center rounded-md border bg-white shadow-sm hover:bg-gray-100">
			<Popover>
				<PopoverTrigger
					disabled={isEditingLabel}
					className="flex h-10 w-full min-w-0 cursor-pointer items-center gap-2 pl-3 focus:outline-none"
					aria-label={`Select color: currently ${label || color}`}
				>
					<ColorCircle color={color} size="sm" className="flex-shrink-0" />

					{isEditingLabel ? (
						<Input
							type="text"
							className="my-0 mr-2 h-7 px-2 py-0 text-sm"
							aria-label={`Change label for color preset ${label}`}
							defaultValue={label || color}
							onBlur={(e) => saveLabelChange(e.target.value)}
							onKeyDown={(e) =>
								e.key === "Enter" && saveLabelChange(e.currentTarget.value)
							}
							// the autofocus kinda nice tho
							// eslint-disable-next-line jsx-a11y/no-autofocus
							autoFocus
						/>
					) : (
						<div className="flex max-w-full grow items-center justify-between gap-2">
							<span className="max-w-40 truncate text-sm font-medium">
								{label || color}
							</span>
							<span className="font-mono text-xs text-gray-500">{color}</span>
						</div>
					)}
				</PopoverTrigger>
				<PopoverContent
					className="w-auto overflow-clip p-0"
					aria-label="Color picker"
				>
					<ColorPicker
						presets={presets}
						presetsOnly={presetsOnly}
						color={color}
						onChange={(newColor) => {
							onChange({
								label: label || newColor,
								value: newColor,
							});
						}}
					/>
				</PopoverContent>
			</Popover>

			<div className="ml-auto flex items-center gap-0 px-2">
				{!isEditingLabel && (
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 p-0 opacity-0 transition-opacity hover:bg-gray-200 group-hover:opacity-100"
						onClick={() => setIsEditingLabel(true)}
						tabIndex={-1}
						aria-label={`Edit label for color preset ${label}`}
					>
						<Pencil className="h-3.5 w-3.5" />
						<span className="sr-only">Edit label</span>
					</Button>
				)}

				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="ml-1 h-7 w-7 p-0 hover:bg-gray-200 hover:text-destructive"
					onClick={() => {
						parentField.onChange(
							parentField.value?.filter((_, i) => i !== idx),
						);
					}}
					aria-label={`Remove color preset ${label}`}
				>
					<TrashIcon className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
};

export default (
	props: ComponentConfigFormProps<InputComponent.colorPicker>,
) => {
	// for some reason if i use `props.form` the watched values don't update when the form values change
	const reactiveForm =
		useFormContext<ConfigFormData<InputComponent.colorPicker>>();
	const presets = reactiveForm.watch("config.presets");
	const presetsOnly = reactiveForm.watch("config.presetsOnly");

	const presetsOnlyEnabled = Boolean(presets?.length);

	// doesn't make sense to set presets only if there are no presets
	useEffect(() => {
		if (presetsOnly && !presetsOnlyEnabled) {
			reactiveForm.setValue("config.presetsOnly", false);
		}
	}, [presets, presetsOnly]);

	return (
		<>
			<FormField
				control={reactiveForm.control}
				name="config.label"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Label</FormLabel>
						<FormControl>
							<Input
								className="bg-white"
								placeholder="Color selection label"
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={reactiveForm.control}
				name="config.help"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Help Text</FormLabel>
						<FormControl>
							<Input
								className="bg-white"
								placeholder="Optional guidance for color selection"
								{...field}
							/>
						</FormControl>
						<FormDescription>Appears below the color picker</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={reactiveForm.control}
				name="config.presets"
				render={({ field }) => (
					<FormItem className="flex flex-col gap-2">
						<FormLabel>Color Presets</FormLabel>
						{field.value?.map((preset, idx) => (
							<FormField
								key={idx}
								control={reactiveForm.control}
								name={`config.presets.${idx}`}
								render={({ field: subField }) => (
									<FormBuilderColorPickerPopover
										key={idx}
										idx={idx}
										parentField={field}
										color={subField.value.value}
										label={subField.value.label}
										onChange={(value) => {
											subField.onChange(value);
										}}
									/>
								)}
							/>
						))}

						<Button
							type="button"
							variant="outline"
							className="mt-2"
							onClick={() => {
								const currentPresets = field.value ?? [];
								field.onChange([
									...currentPresets,
									{ label: "New preset", value: "#000000" },
								]);
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
				control={reactiveForm.control}
				name="config.presetsOnly"
				defaultValue={false}
				render={({ field }) => (
					<FormItem
						className={cn(
							"flex flex-row items-start space-x-3 space-y-0 rounded-md border bg-white p-4",
							!presetsOnlyEnabled && "opacity-60",
						)}
					>
						<FormControl>
							<Checkbox
								disabled={!presetsOnlyEnabled}
								checked={field.value}
								onCheckedChange={field.onChange}
							/>
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
