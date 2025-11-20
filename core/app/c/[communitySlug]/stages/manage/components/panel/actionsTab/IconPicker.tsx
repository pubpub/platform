import { Suspense, use, useMemo } from "react";

import type { IconConfig } from "ui/icon";
import { Button } from "ui/button";
import { ColorPicker } from "ui/color";
import { FormDescription, FormLabel } from "ui/form";
import { DynamicIcon } from "ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { cn } from "utils";

import { entries } from "~/lib/mapping";

const DEFAULT_ICON_PRESETS = [
	{ label: "Emerald", value: "#10b981" },
	{ label: "Blue", value: "#3b82f6" },
	{ label: "Violet", value: "#c4b5fd" },
	{ label: "Rose", value: "#f472b6" },
	{ label: "Amber", value: "#f59e0b" },
	{ label: "Sky", value: "#60a5fa" },
	{ label: "Pink", value: "#f9a8d4" },
	{ label: "Teal", value: "#2dd4bf" },
];

export const IconPicker = ({
	value,
	onChange,
}: {
	value?: IconConfig;
	onChange: (icon: IconConfig) => void;
}) => {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" className="h-9 w-9 bg-violet-300 p-0" type="button">
					<DynamicIcon icon={value} size={16} />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-3" align="start">
				<Suspense fallback={<div>Loading...</div>}>
					<IconPickerContent value={value} onChange={onChange} />
				</Suspense>
			</PopoverContent>
		</Popover>
	);
};

const IconMap = import("ui/icon").then((mod) => mod.ICON_MAP);

export const IconPickerContent = ({
	value,
	onChange,
}: {
	value?: IconConfig;
	onChange: (icon: IconConfig) => void;
}) => {
	const iconMap = use(IconMap);

	const icons = useMemo(
		() => (
			<>
				{entries(iconMap).map(([name, Icon]) => (
					<Button
						key={name}
						variant="ghost"
						className={cn(
							"h-10 w-10 p-0",
							value?.color && "bg-white",
							value?.name === name && "bg-gray-200"
						)}
						type="button"
						onClick={() => onChange({ name, color: value?.color })}
					>
						<Icon
							size={16}
							style={{
								stroke: value?.variant === "solid" ? "black" : value?.color,
								fill: value?.variant === "solid" ? value?.color : "transparent",
							}}
						/>
					</Button>
				))}
			</>
		),
		[iconMap, onChange]
	);

	if (!iconMap) return "No icons";

	return (
		<div className="space-y-2">
			<FormLabel className="sr-only text-xs">Icon</FormLabel>
			<div className="flex items-center gap-2">
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className="h-9 w-9 overflow-clip rounded-full p-0"
							type="button"
							style={{
								backgroundColor: value?.color ?? "transparent",
							}}
						/>
					</PopoverTrigger>
					<PopoverContent
						className="w-auto overflow-clip !border-0 border-transparent bg-transparent p-0 shadow-none"
						align="start"
					>
						<ColorPicker
							color={value?.color ?? "#000000"}
							onChange={(color) => {
								onChange({
									name: value?.name || "bot",
									color,
									variant: value?.variant || "outline",
								});
							}}
							presets={DEFAULT_ICON_PRESETS}
						/>
					</PopoverContent>
				</Popover>
				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={value?.variant === "solid"}
						onChange={(e) => {
							onChange({
								name: value?.name || "bot",
								color: value?.color,
								variant: e.target.checked ? "solid" : "outline",
							});
						}}
						className="h-4 w-4 rounded border-neutral-300"
					/>
					<span className="text-neutral-700">Filled</span>
				</label>
			</div>
			<div className="grid grid-cols-8 gap-1">{icons}</div>
			<FormDescription className="text-xs">
				Use Lucide icon names (kebab-case)
			</FormDescription>
		</div>
	);
};
