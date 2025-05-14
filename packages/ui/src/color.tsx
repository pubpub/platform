import * as React from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";

import { cn } from "utils";
import { isColorDark } from "utils/color";

export type ColorPickerProps = React.ComponentPropsWithoutRef<typeof HexColorPicker>;

export function ColorBackground(props: {
	color: string;
	className?: string;
	children?: React.ReactNode;
}) {
	const isDark = isColorDark(props.color);
	return (
		<div
			className={cn("h-4 w-4 rounded-full", props.className)}
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

export function ColorPicker(props: ColorPickerProps) {
	const isDark = isColorDark(props.color || "#000000");

	return (
		<div>
			<HexColorPicker
				className="[&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-none"
				aria-label="Color picker"
				{...props}
			/>
			<HexColorInput
				className={cn(
					"w-[200px] rounded-b-md border-none text-center font-mono",
					isDark ? "text-white" : "text-black",
					"font-md uppercase tracking-wider"
				)}
				prefixed
				style={{
					background: props.color,
				}}
				aria-label="Hex color value"
				{...props}
			/>
		</div>
	);
}
