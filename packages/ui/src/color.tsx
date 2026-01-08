import * as React from "react"
import { HexAlphaColorPicker, HexColorInput } from "react-colorful"

import { cn } from "utils"
import { isColorDark } from "utils/color"

import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

export type ColorPickerProps = React.ComponentPropsWithoutRef<typeof HexAlphaColorPicker> & {
	onChange: (color: string) => void
	presets?: { label: string; value: string }[]
	presetsOnly?: boolean
}

export function ColorBackground(props: {
	color: string
	className?: string
	children?: React.ReactNode
}) {
	const isDark = isColorDark(props.color)
	return (
		<div
			className={cn("flex items-center justify-center", props.className)}
			style={{ backgroundColor: props.color, color: isDark ? "white" : "black" }}
		>
			{props.children}
		</div>
	)
}

export function ColorCircle(props: {
	color: string
	size: "sm" | "md" | "lg"
	className?: string
}) {
	return (
		<div
			className={cn("rounded-full", props.className, {
				"h-4 w-4": props.size === "sm",
				"h-6 w-6": props.size === "md",
				"h-8 w-8": props.size === "lg",
			})}
			style={{ backgroundColor: props.color }}
		/>
	)
}

export function ColorLabel(props: { className?: string; children: React.ReactNode }) {
	return (
		<div
			className={cn(
				"flex w-min items-center gap-2 rounded-md border px-3 py-1",
				props.className
			)}
		>
			{props.children}
		</div>
	)
}

export function ColorValue(props: { color: string; className?: string }) {
	return (
		<span className={cn("font-md font-mono uppercase tracking-wider", props.className)}>
			{props.color}
		</span>
	)
}

export function ColorPicker({ presets, presetsOnly, ...props }: ColorPickerProps) {
	const isDark = isColorDark(props.color || "#000000")

	return (
		<div className="flex gap-2 bg-transparent">
			{!presetsOnly && (
				<div className="flex h-fit flex-col overflow-clip rounded-md bg-transparent shadow-lg">
					<HexAlphaColorPicker
						className="[&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-none"
						aria-label="Color picker"
						{...props}
					/>
					<HexColorInput
						data-testid="color-picker-input"
						alpha={true}
						className={cn(
							"w-[200px] border-none text-center font-medium font-mono uppercase tracking-wider",
							isDark ? "text-white" : "text-black"
						)}
						prefixed
						style={{
							background: props.color,
						}}
						aria-label="Hex color value"
						{...props}
					/>
				</div>
			)}
			{presets && (
				<div
					className={cn("grid gap-1.5 rounded-lg border bg-white px-2 py-2 shadow-md", {
						"h-fit max-h-60 grid-flow-col grid-rows-[repeat(auto-fit,32px)]":
							!presetsOnly,
						"max-w-60 grid-flow-row grid-cols-[repeat(auto-fit,32px)]": presetsOnly,
					})}
				>
					{presets.map((preset, idx) => (
						<Tooltip key={`preset-${preset.label}-${idx}`}>
							<TooltipTrigger asChild>
								<div className="flex h-8 w-8 items-center">
									<input
										type="radio"
										id={`preset-${preset.label}-${idx}`}
										name="color-preset"
										className="sr-only"
										checked={props.color === preset.value}
										onChange={() => props.onChange(preset.value)}
									/>
									<label
										htmlFor={`preset-${preset.label}-${idx}`}
										className={cn(
											"flex h-8 w-8 cursor-pointer items-center justify-center"
										)}
									>
										<span className="sr-only">
											Select preset {preset.label}
										</span>
										<ColorBackground
											color={preset.value}
											className={cn(
												"h-full w-full rounded-md border-2",
												props.color === preset.value
													? "border-primary"
													: "border-transparent"
											)}
										/>
									</label>
								</div>
							</TooltipTrigger>
							<TooltipContent
								side={presetsOnly ? "top" : "right"}
								sideOffset={10}
								className="flex items-center gap-2"
							>
								<span className="font-mono">{preset.label}</span>
								<span className="font-mono text-muted-foreground">
									{preset.value}
								</span>
							</TooltipContent>
						</Tooltip>
					))}
				</div>
			)}
		</div>
	)
}
