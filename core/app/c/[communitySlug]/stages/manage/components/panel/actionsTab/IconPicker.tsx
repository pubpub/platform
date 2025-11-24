import type { IconConfig } from "ui/icon"

import { Suspense, use, useMemo } from "react"
import { XIcon } from "lucide-react"

import { Button } from "ui/button"
import { FormLabel } from "ui/form"
import { DynamicIcon } from "ui/icon"
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover"
import { cn } from "utils"

import { ColorPickerPopover } from "~/app/components/forms/elements/ColorPickerElement"
import { entries } from "~/lib/mapping"

const DEFAULT_ICON_COLOR_PRESETS = [
	{ label: "Emerald", value: "#10b981" },
	{ label: "Blue", value: "#3b82f6" },
	{ label: "Violet", value: "#c4b5fd" },
	{ label: "Rose", value: "#f472b6" },
	{ label: "Amber", value: "#f59e0b" },
	{ label: "Sky", value: "#60a5fa" },
	{ label: "Pink", value: "#f9a8d4" },
	{ label: "Teal", value: "#2dd4bf" },
]

export const IconPicker = ({
	value,
	onChange,
}: {
	value?: IconConfig
	onChange: (icon: IconConfig) => void
}) => {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" className="h-9 w-9 p-0" type="button">
					<DynamicIcon icon={value} size={16} />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-3" align="start">
				<Suspense fallback={<div>Loading...</div>}>
					<IconPickerContent value={value} onChange={onChange} />
				</Suspense>
			</PopoverContent>
		</Popover>
	)
}

const IconMap = import("ui/icon").then((mod) => mod.ICON_MAP)

export const IconPickerContent = ({
	value,
	onChange,
}: {
	value?: IconConfig
	onChange: (icon: IconConfig) => void
}) => {
	const iconMap = use(IconMap)

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
		[iconMap, onChange, value?.color, value?.name, value?.variant]
	)

	if (!iconMap) return "No icons"

	return (
		<div className="space-y-2">
			<FormLabel className="sr-only text-xs">Icon</FormLabel>
			<div className="flex items-center justify-between gap-2">
				<ColorPickerPopover
					color={value?.color ?? "#000000"}
					onChange={(color) => {
						onChange({
							name: value?.name || "bot",
							color,
							variant: "outline",
						})
					}}
					presets={DEFAULT_ICON_COLOR_PRESETS}
				/>
				{value?.color || (value?.name && value?.name !== "bot") ? (
					<Button
						variant="ghost"
						size="sm"
						type="button"
						onClick={() =>
							onChange({
								name: "bot",
								color: undefined,
								variant: "outline",
							})
						}
					>
						<span className="sr-only">Clear icon</span>
						<XIcon className="h-4 w-4" />
					</Button>
				) : null}
			</div>
			<div className="grid grid-cols-8 gap-1">{icons}</div>
		</div>
	)
}
