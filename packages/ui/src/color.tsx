import * as React from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";

import { cn } from "utils";
import { isColorDark } from "utils/color";

import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export type ColorPickerProps = React.ComponentPropsWithoutRef<typeof HexColorPicker> & {
	onChange: (color: string) => void;
	presets?: { label: string; value: string }[];
	presetsOnly?: boolean;
};

export function ColorBackground(props: {
	color: string;
	className?: string;
	children?: React.ReactNode;
}) {
	const isDark = isColorDark(props.color);
	return (
		<div
			className={cn("flex items-center justify-center", props.className)}
			style={{ backgroundColor: props.color, color: isDark ? "white" : "black" }}
		>
			{props.children}
		</div>
	);
}

export function ColorCircle(props: {
	color: string;
	size: "sm" | "md" | "lg";
	className?: string;
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
	);
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
	);
}

export function ColorValue(props: { color: string; className?: string }) {
	return (
		<span className={cn("font-md font-mono uppercase tracking-wider", props.className)}>
			{props.color}
		</span>
	);
}

export function ColorPicker({ presets, presetsOnly, ...props }: ColorPickerProps) {
	const isDark = isColorDark(props.color || "#000000");

	return (
		<div className="grid grid-cols-[1fr,auto] gap-2 bg-transparent p-10">
			{!presetsOnly && (
				<div className="flex flex-col overflow-clip rounded-md bg-transparent shadow-lg">
					<HexColorPicker
						className="[&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-none"
						aria-label="Color picker"
						{...props}
					/>
					<HexColorInput
						className={cn(
							"w-[200px] border-none text-center font-mono font-medium uppercase tracking-wider",
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
					className={cn(
						"grid grid-flow-col grid-rows-6 gap-1 rounded-lg border bg-white px-1.5 py-1.5 shadow-md",
						presetsOnly ? "grid-cols-[repeat(auto-fit,32px)]" : "grid-cols-1"
					)}
				>
					{presets.map((preset, idx) => (
						<Tooltip key={`preset-${preset.label}-${idx}`}>
							<TooltipTrigger asChild>
								<div className="flex items-center">
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
	);
}
