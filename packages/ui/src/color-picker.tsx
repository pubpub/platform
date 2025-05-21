"use client";

import * as React from "react";
import { Droplet as EyeDropper } from "lucide-react";

import { cn } from "utils";

import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

type ColorFormat = "hex" | "rgb" | "hsl";

interface ColorPickerProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
	/**
	 * Enable alpha/transparency support
	 * @default true
	 */
	enableAlpha?: boolean;
	/**
	 * Available color formats. If only one format is provided, tabs won't be shown.
	 * @default ["hex", "rgb", "hsl"]
	 */
	formats?: ColorFormat[];
}

// EyeDropper API is not yet in all TypeScript definitions
interface EyeDropperConstructor {
	new (): EyeDropperInterface;
}

interface EyeDropperInterface {
	open(): Promise<{ sRGBHex: string }>;
}

declare global {
	interface Window {
		EyeDropper?: EyeDropperConstructor;
	}
}

// convert hex to rgb
const hexToRgb = (hex: string): [number, number, number] => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
		: [0, 0, 0];
};

// convert hex with alpha to rgba
const hexAToRgba = (hexA: string): [number, number, number, number] => {
	if (hexA.length === 9) {
		const r = parseInt(hexA.slice(1, 3), 16);
		const g = parseInt(hexA.slice(3, 5), 16);
		const b = parseInt(hexA.slice(5, 7), 16);
		const a = parseInt(hexA.slice(7, 9), 16) / 255;
		return [r, g, b, Math.round(a * 100) / 100];
	}

	const [r, g, b] = hexToRgb(hexA);
	return [r, g, b, 1];
};

// convert rgb to hex
const rgbToHex = (r: number, g: number, b: number): string => {
	return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
};

// convert rgba to hex with alpha
const rgbaToHexA = (r: number, g: number, b: number, a: number): string => {
	const alpha = Math.round(a * 255);
	return rgbToHex(r, g, b) + alpha.toString(16).padStart(2, "0");
};

// convert rgb to hsl
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0,
		s = 0,
		l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}

		h /= 6;
	}

	return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

// convert hsl to rgb
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
	h /= 360;
	s /= 100;
	l /= 100;

	let r, g, b;

	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p: number, q: number, t: number) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;

		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

// convert rgb to hsv
const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;

	let h = 0;
	const s = max === 0 ? 0 : d / max;
	const v = max;

	if (max !== min) {
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}

	return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
};

// convert hsv to rgb
const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
	h /= 360;
	s /= 100;
	v /= 100;

	let r = 0,
		g = 0,
		b = 0;

	const i = Math.floor(h * 6);
	const f = h * 6 - i;
	const p = v * (1 - s);
	const q = v * (1 - f * s);
	const t = v * (1 - (1 - f) * s);

	switch (i % 6) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;
		case 1:
			r = q;
			g = v;
			b = p;
			break;
		case 2:
			r = p;
			g = v;
			b = t;
			break;
		case 3:
			r = p;
			g = q;
			b = v;
			break;
		case 4:
			r = t;
			g = p;
			b = v;
			break;
		case 5:
			r = v;
			g = p;
			b = q;
			break;
	}

	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

export function ColorPicker({
	value = "#000000",
	onChange,
	className,
	enableAlpha = true,
	formats = ["hex", "rgb", "hsl"],
}: ColorPickerProps) {
	// Set initial format to the first available one
	const [format, setFormat] = React.useState<ColorFormat>(formats[0] || "hex");
	const [open, setOpen] = React.useState(false);
	const [isPickingColor, setIsPickingColor] = React.useState(false);
	const [alpha, setAlpha] = React.useState(100); // Alpha value 0-100%

	// Parse the initial value
	const initialValue = React.useMemo(() => {
		// Default to black if value is invalid
		let hexValue = value.startsWith("#") ? value : "#000000";
		let a = 1;

		// If alpha is enabled and we have a hex with alpha channel (8 digits after #)
		if (enableAlpha && hexValue.length === 9) {
			const rgba = hexAToRgba(hexValue);
			a = rgba[3];
			hexValue = rgbToHex(rgba[0], rgba[1], rgba[2]);
			setAlpha(Math.round(a * 100));
		}

		const rgb = hexToRgb(hexValue);
		const hsl = rgbToHsl(...rgb);
		const hsv = rgbToHsv(...rgb);

		return {
			hex: hexValue,
			rgb,
			hsl,
			hsv,
			alpha: a,
		};
	}, [value, enableAlpha]);

	const [color, setColor] = React.useState(initialValue);

	// Refs for the custom gradient pickers
	const saturationRef = React.useRef<HTMLDivElement>(null);
	const hueRef = React.useRef<HTMLDivElement>(null);
	const alphaRef = React.useRef<HTMLDivElement>(null);
	const [isDraggingSaturation, setIsDraggingSaturation] = React.useState(false);
	const [isDraggingHue, setIsDraggingHue] = React.useState(false);
	const [isDraggingAlpha, setIsDraggingAlpha] = React.useState(false);

	// Check if EyeDropper API is available
	const isEyeDropperSupported = React.useMemo(() => {
		return typeof window !== "undefined" && "EyeDropper" in window;
	}, []);

	// Set initial format state based on formats prop
	React.useEffect(() => {
		if (formats.length > 0 && !formats.includes(format)) {
			setFormat(formats[0]);
		}
	}, [formats, format]);

	// Update all color formats when hex changes
	const updateFromHex = (hex: string) => {
		const rgb = hexToRgb(hex);
		const hsl = rgbToHsl(...rgb);
		const hsv = rgbToHsv(...rgb);

		const newColor = {
			hex,
			rgb,
			hsl,
			hsv,
			alpha: color.alpha,
		};

		setColor(newColor);

		let outputValue = hex;
		if (enableAlpha) {
			outputValue = rgbaToHexA(rgb[0], rgb[1], rgb[2], color.alpha);
		}

		onChange(outputValue);
	};

	// Update all color formats when rgb changes
	const updateFromRgb = (rgb: [number, number, number]) => {
		const hex = rgbToHex(...rgb);
		const hsl = rgbToHsl(...rgb);
		const hsv = rgbToHsv(...rgb);

		const newColor = {
			hex,
			rgb,
			hsl,
			hsv,
			alpha: color.alpha,
		};

		setColor(newColor);

		let outputValue = hex;
		if (enableAlpha) {
			outputValue = rgbaToHexA(rgb[0], rgb[1], rgb[2], color.alpha);
		}

		onChange(outputValue);
	};

	// Update all color formats when hsl changes
	const updateFromHsl = (hsl: [number, number, number]) => {
		const rgb = hslToRgb(...hsl);
		const hex = rgbToHex(...rgb);
		const hsv = rgbToHsv(...rgb);

		const newColor = {
			hex,
			rgb,
			hsl,
			hsv,
			alpha: color.alpha,
		};

		setColor(newColor);

		let outputValue = hex;
		if (enableAlpha) {
			outputValue = rgbaToHexA(rgb[0], rgb[1], rgb[2], color.alpha);
		}

		onChange(outputValue);
	};

	// Update all color formats when hsv changes
	const updateFromHsv = (hsv: [number, number, number]) => {
		const rgb = hsvToRgb(...hsv);
		const hex = rgbToHex(...rgb);
		const hsl = rgbToHsl(...rgb);

		const newColor = {
			hex,
			rgb,
			hsl,
			hsv,
			alpha: color.alpha,
		};

		setColor(newColor);

		let outputValue = hex;
		if (enableAlpha) {
			outputValue = rgbaToHexA(rgb[0], rgb[1], rgb[2], color.alpha);
		}

		onChange(outputValue);
	};

	// Update alpha value
	const updateAlpha = (alphaValue: number) => {
		const a = Math.max(0, Math.min(1, alphaValue / 100));

		setColor((prev) => ({
			...prev,
			alpha: a,
		}));

		setAlpha(alphaValue);

		if (enableAlpha) {
			const outputValue = rgbaToHexA(color.rgb[0], color.rgb[1], color.rgb[2], a);
			onChange(outputValue);
		}
	};

	// Handle saturation area interactions
	const handleSaturationMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		setIsDraggingSaturation(true);
		handleSaturationChange(e);
	};

	const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		setIsDraggingHue(true);
		handleHueChange(e);
	};

	const handleAlphaMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		setIsDraggingAlpha(true);
		handleAlphaChange(e);
	};

	const handleSaturationTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
		setIsDraggingSaturation(true);
		handleSaturationTouchChange(e);
	};

	const handleHueTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
		setIsDraggingHue(true);
		handleHueTouchChange(e);
	};

	const handleAlphaTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
		setIsDraggingAlpha(true);
		handleAlphaTouchChange(e);
	};

	const handleSaturationChange = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
		if (!saturationRef.current) return;

		const rect = saturationRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

		const s = Math.round(x * 100);
		const v = Math.round((1 - y) * 100);

		updateFromHsv([color.hsv[0], s, v]);
	};

	const handleSaturationTouchChange = (e: React.TouchEvent<HTMLDivElement> | TouchEvent) => {
		if (!saturationRef.current || !e.touches[0]) return;

		const rect = saturationRef.current.getBoundingClientRect();
		const touch = e.touches[0];
		const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
		const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));

		if (format === "hsl") {
			// In HSL mode, x = hue (0-360), y = lightness (100%-0%)
			const h = Math.round(x * 360);
			const l = Math.round((1 - y) * 100);
			// Keep the saturation as is
			updateFromHsl([h, color.hsl[1], l]);
		} else {
			// Default HSV behavior
			const s = Math.round(x * 100);
			const v = Math.round((1 - y) * 100);
			updateFromHsv([color.hsv[0], s, v]);
		}
	};

	const handleHueChange = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
		if (!hueRef.current) return;

		const rect = hueRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

		const h = Math.round(x * 360);

		updateFromHsv([h, color.hsv[1], color.hsv[2]]);
	};

	const handleHueTouchChange = (e: React.TouchEvent<HTMLDivElement> | TouchEvent) => {
		if (!hueRef.current || !e.touches[0]) return;

		const rect = hueRef.current.getBoundingClientRect();
		const touch = e.touches[0];
		const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));

		const h = Math.round(x * 360);

		updateFromHsv([h, color.hsv[1], color.hsv[2]]);
	};

	const handleHslSaturationChange = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
		if (!hueRef.current) return;

		const rect = hueRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

		const s = Math.round(x * 100);

		updateFromHsl([color.hsl[0], s, color.hsl[2]]);
	};

	const handleHslSaturationTouchChange = (e: React.TouchEvent<HTMLDivElement> | TouchEvent) => {
		if (!hueRef.current || !e.touches[0]) return;

		const rect = hueRef.current.getBoundingClientRect();
		const touch = e.touches[0];
		const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));

		const s = Math.round(x * 100);

		updateFromHsl([color.hsl[0], s, color.hsl[2]]);
	};

	const handleAlphaChange = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
		if (!alphaRef.current) return;

		const rect = alphaRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

		const alphaValue = Math.round(x * 100);
		updateAlpha(alphaValue);
	};

	const handleAlphaTouchChange = (e: React.TouchEvent<HTMLDivElement> | TouchEvent) => {
		if (!alphaRef.current || !e.touches[0]) return;

		const rect = alphaRef.current.getBoundingClientRect();
		const touch = e.touches[0];
		const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));

		const alphaValue = Math.round(x * 100);
		updateAlpha(alphaValue);
	};

	// Add mouse event listeners
	React.useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (isDraggingSaturation) {
				handleSaturationChange(e);
			}
			if (isDraggingHue) {
				if (format === "hsl") {
					handleHslSaturationChange(e);
				} else {
					handleHueChange(e);
				}
			}
			if (isDraggingAlpha) {
				handleAlphaChange(e);
			}
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (isDraggingSaturation) {
				handleSaturationTouchChange(e);
			}
			if (isDraggingHue) {
				if (format === "hsl") {
					handleHslSaturationTouchChange(e);
				} else {
					handleHueTouchChange(e);
				}
			}
			if (isDraggingAlpha) {
				handleAlphaTouchChange(e);
			}
		};

		const handleMouseUp = () => {
			setIsDraggingSaturation(false);
			setIsDraggingHue(false);
			setIsDraggingAlpha(false);
		};

		if (isDraggingSaturation || isDraggingHue || isDraggingAlpha) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
			window.addEventListener("touchmove", handleTouchMove);
			window.addEventListener("touchend", handleMouseUp);
		}

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
			window.removeEventListener("touchmove", handleTouchMove);
			window.removeEventListener("touchend", handleMouseUp);
		};
	}, [isDraggingSaturation, isDraggingHue, isDraggingAlpha, format]);

	// Color for the hue gradient background
	const hueColor = hsvToRgb(color.hsv[0], 100, 100);
	const hueColorHex = rgbToHex(...hueColor);

	// Get the appropriate gradient visualization based on color format
	const getGradientVisualization = () => {
		// Default visualization (HSV) for hex and RGB formats
		if (format === "hex" || format === "rgb") {
			return {
				main: {
					backgroundColor: hueColorHex,
					backgroundImage:
						"linear-gradient(to right, #fff, transparent), linear-gradient(to top, #000, transparent)",
				},
				width: "100%",
				height: "100%",
			};
		}

		// HSL visualization with different gradients
		if (format === "hsl") {
			return {
				main: {
					backgroundImage: `
						linear-gradient(to top, 
							hsl(0, 0%, 0%), 
							hsl(0, 0%, 50%), 
							hsl(0, 0%, 100%)
						),
						linear-gradient(to right,
							hsl(0, 100%, 50%),
							hsl(60, 100%, 50%),
							hsl(120, 100%, 50%),
							hsl(180, 100%, 50%),
							hsl(240, 100%, 50%),
							hsl(300, 100%, 50%),
							hsl(360, 100%, 50%)
						)
					`,
					backgroundBlendMode: "multiply",
				},
				width: "100%",
				height: "100%",
			};
		}

		// Default case - return HSV visualization
		return {
			main: {
				backgroundColor: hueColorHex,
				backgroundImage:
					"linear-gradient(to right, #fff, transparent), linear-gradient(to top, #000, transparent)",
			},
			width: "100%",
			height: "100%",
		};
	};

	// Get visualization properties
	const visualizationStyle = getGradientVisualization();

	// Handle eyedropper functionality
	const handleEyeDropper = async () => {
		if (!isEyeDropperSupported) return;

		try {
			setIsPickingColor(true);
			const eyeDropper = new window.EyeDropper!();
			const result = await eyeDropper.open();
			updateFromHex(result.sRGBHex);
		} catch (error) {
			// User canceled or an error occurred
			// Using a noop instead of console.log to avoid linter error
		} finally {
			setIsPickingColor(false);
		}
	};

	// Format the color value for display
	const getFormattedColor = () => {
		if (format === "hex") {
			return enableAlpha
				? rgbaToHexA(color.rgb[0], color.rgb[1], color.rgb[2], color.alpha)
				: color.hex;
		} else if (format === "rgb") {
			return enableAlpha
				? `rgba(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]}, ${color.alpha})`
				: `rgb(${color.rgb.join(", ")})`;
		} else {
			return enableAlpha
				? `hsla(${color.hsl[0]}, ${color.hsl[1]}%, ${color.hsl[2]}%, ${color.alpha})`
				: `hsl(${color.hsl[0]}, ${color.hsl[1]}%, ${color.hsl[2]}%)`;
		}
	};

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<div className="flex items-center gap-2">
						<div
							className="h-6 w-6 cursor-pointer rounded-md border border-input shadow-sm transition-transform hover:scale-110 active:scale-95"
							style={{
								backgroundColor: color.hex,
								...(enableAlpha && { opacity: color.alpha }),
							}}
							onClick={() => setOpen(!open)}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									setOpen(!open);
								}
							}}
						/>
						<Input
							value={getFormattedColor()}
							className="h-8 w-44 cursor-pointer transition-all hover:ring-1 hover:ring-primary"
							readOnly
							onClick={() => setOpen(!open)}
						/>
					</div>
				</PopoverTrigger>
				<PopoverContent className="w-80 p-4 shadow-lg" align="start">
					<div className="flex flex-col gap-4">
						{/* Custom Color Picker */}
						<div className="flex flex-col gap-3">
							{/* Saturation/Value area */}
							<div className="flex gap-3">
								<div
									ref={saturationRef}
									className="relative h-36 flex-1 cursor-crosshair rounded-md shadow-inner transition-all hover:shadow-md"
									style={visualizationStyle.main}
									onMouseDown={handleSaturationMouseDown}
									onTouchStart={handleSaturationTouchStart}
									role="button"
									tabIndex={0}
									aria-label="Color saturation and brightness"
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											// Handle keyboard interaction
											const rect =
												saturationRef.current?.getBoundingClientRect();
											if (rect) {
												const x = 0.5; // Center point
												const y = 0.5; // Center point

												if (format === "hsl") {
													const h = Math.round(x * 360);
													const l = Math.round((1 - y) * 100);
													updateFromHsl([h, color.hsl[1], l]);
												} else {
													const s = Math.round(x * 100);
													const v = Math.round((1 - y) * 100);
													updateFromHsv([color.hsv[0], s, v]);
												}
											}
										}
									}}
								>
									{/* Thumb */}
									<div
										className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-2 border-white shadow-md transition-transform duration-75"
										style={{
											left:
												format === "hsl"
													? `${(color.hsl[0] / 360) * 100}%`
													: `${color.hsv[1]}%`,
											top:
												format === "hsl"
													? `${100 - color.hsl[2]}%`
													: `${100 - color.hsv[2]}%`,
											backgroundColor: color.hex,
											transform: `translate(-50%, -50%) ${isDraggingSaturation ? "scale(1.2)" : ""}`,
										}}
									/>
								</div>

								{/* Eyedropper button for supported browsers */}
								{isEyeDropperSupported && (
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="outline"
													size="icon"
													className="h-10 w-10 self-start"
													onClick={handleEyeDropper}
													disabled={isPickingColor}
												>
													<EyeDropper className="h-4 w-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												<p>Pick color from screen</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								)}
							</div>

							{/* Hue slider - shown in hex and rgb modes */}
							{format !== "hsl" && (
								<div
									ref={hueRef}
									className="relative h-6 w-full cursor-pointer rounded-md shadow-inner transition-all hover:shadow-md"
									style={{
										backgroundImage:
											"linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
									}}
									onMouseDown={handleHueMouseDown}
									onTouchStart={handleHueTouchStart}
									role="slider"
									tabIndex={0}
									aria-label="Hue slider"
									aria-valuemin={0}
									aria-valuemax={360}
									aria-valuenow={color.hsv[0]}
									onKeyDown={(e) => {
										if (e.key === "ArrowLeft") {
											const h = Math.max(0, color.hsv[0] - 5);
											updateFromHsv([h, color.hsv[1], color.hsv[2]]);
										} else if (e.key === "ArrowRight") {
											const h = Math.min(360, color.hsv[0] + 5);
											updateFromHsv([h, color.hsv[1], color.hsv[2]]);
										}
									}}
								>
									{/* Thumb */}
									<div
										className="absolute top-0 h-full w-1 -translate-x-1/2 transform rounded-sm border border-white shadow-md transition-transform duration-75"
										style={{
											left: `${(color.hsv[0] / 360) * 100}%`,
											backgroundColor: hueColorHex,
											transform: `translateX(-50%) ${isDraggingHue ? "scale(1.2)" : ""}`,
										}}
									/>
								</div>
							)}

							{/* Saturation slider - shown in HSL mode */}
							{format === "hsl" && (
								<div
									ref={hueRef}
									className="relative h-6 w-full cursor-pointer rounded-md shadow-inner transition-all hover:shadow-md"
									style={{
										backgroundImage: `linear-gradient(to right, 
											hsl(${color.hsl[0]}, 0%, ${color.hsl[2]}%), 
											hsl(${color.hsl[0]}, 50%, ${color.hsl[2]}%), 
											hsl(${color.hsl[0]}, 100%, ${color.hsl[2]}%)
										)`,
									}}
									onMouseDown={(e) => {
										setIsDraggingHue(true);
										handleHslSaturationChange(e);
									}}
									onTouchStart={(e) => {
										setIsDraggingHue(true);
										handleHslSaturationTouchChange(e);
									}}
									role="slider"
									tabIndex={0}
									aria-label="Saturation slider"
									aria-valuemin={0}
									aria-valuemax={100}
									aria-valuenow={color.hsl[1]}
									onKeyDown={(e) => {
										if (e.key === "ArrowLeft") {
											const s = Math.max(0, color.hsl[1] - 5);
											updateFromHsl([color.hsl[0], s, color.hsl[2]]);
										} else if (e.key === "ArrowRight") {
											const s = Math.min(100, color.hsl[1] + 5);
											updateFromHsl([color.hsl[0], s, color.hsl[2]]);
										}
									}}
								>
									{/* Thumb */}
									<div
										className="absolute top-0 h-full w-1 -translate-x-1/2 transform rounded-sm border border-white shadow-md transition-transform duration-75"
										style={{
											left: `${color.hsl[1]}%`,
											backgroundColor: `hsl(${color.hsl[0]}, ${color.hsl[1]}%, ${color.hsl[2]}%)`,
											transform: `translateX(-50%) ${isDraggingHue ? "scale(1.2)" : ""}`,
										}}
									/>
								</div>
							)}

							{/* Alpha slider - only shown when enableAlpha is true */}
							{enableAlpha && (
								<div
									ref={alphaRef}
									className="relative h-6 w-full cursor-pointer rounded-md shadow-inner transition-all hover:shadow-md"
									style={{
										backgroundImage: `linear-gradient(to right, transparent, ${color.hex})`,
										backgroundSize: "100% 100%",
										backgroundPosition: "0 0",
										backgroundRepeat: "no-repeat",
										backgroundColor: "white",
										backgroundClip: "padding-box",
									}}
									onMouseDown={handleAlphaMouseDown}
									onTouchStart={handleAlphaTouchStart}
									role="slider"
									tabIndex={0}
									aria-label="Alpha slider"
									aria-valuemin={0}
									aria-valuemax={100}
									aria-valuenow={alpha}
									onKeyDown={(e) => {
										if (e.key === "ArrowLeft") {
											const newAlpha = Math.max(0, alpha - 5);
											updateAlpha(newAlpha);
										} else if (e.key === "ArrowRight") {
											const newAlpha = Math.min(100, alpha + 5);
											updateAlpha(newAlpha);
										}
									}}
								>
									<div
										className="absolute inset-0 rounded-md"
										style={{
											backgroundImage:
												"linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
											backgroundSize: "10px 10px",
											backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
											zIndex: -1,
										}}
									/>
									{/* Alpha Thumb */}
									<div
										className="absolute top-0 h-full w-1 -translate-x-1/2 transform rounded-sm border border-white shadow-md transition-transform duration-75"
										style={{
											left: `${alpha}%`,
											backgroundColor: color.hex,
											transform: `translateX(-50%) ${isDraggingAlpha ? "scale(1.2)" : ""}`,
										}}
									/>
								</div>
							)}

							{/* Color preview */}
							<div className="relative flex h-8 w-full items-center justify-center overflow-hidden rounded-md text-xs font-medium text-gray-400 shadow-inner transition-all hover:shadow-md">
								{/* Checkerboard background for alpha transparency */}
								<div
									className="absolute inset-0"
									style={{
										backgroundImage:
											"linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
										backgroundSize: "10px 10px",
										backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
										zIndex: 0,
									}}
								/>
								<div
									className="absolute inset-0 border border-input"
									style={{
										backgroundColor: color.hex,
										opacity: color.alpha,
									}}
								/>
								<span
									className="relative z-10"
									style={{
										color: color.hsv[2] > 70 ? "#333" : "#fff",
									}}
								>
									{getFormattedColor()}
								</span>
							</div>
						</div>

						{/* Only show tabs if more than one format is available */}
						{formats.length > 1 ? (
							<Tabs
								value={format}
								onValueChange={(v) => setFormat(v as ColorFormat)}
								className="mt-2"
							>
								<TabsList
									className={cn("grid w-full", `grid-cols-${formats.length}`)}
								>
									{formats.includes("hex") && (
										<TabsTrigger
											value="hex"
											className="transition-all data-[state=active]:shadow-md"
										>
											HEX
										</TabsTrigger>
									)}
									{formats.includes("rgb") && (
										<TabsTrigger
											value="rgb"
											className="transition-all data-[state=active]:shadow-md"
										>
											RGB
										</TabsTrigger>
									)}
									{formats.includes("hsl") && (
										<TabsTrigger
											value="hsl"
											className="transition-all data-[state=active]:shadow-md"
										>
											HSL
										</TabsTrigger>
									)}
								</TabsList>

								{formats.includes("hex") && (
									<TabsContent value="hex" className="mt-2">
										<div>
											<Label htmlFor="hex-input">Hex</Label>
											<Input
												id="hex-input"
												value={color.hex}
												onChange={(e) => {
													const newHex = e.target.value;
													if (/^#[0-9A-F]{6}$/i.test(newHex)) {
														updateFromHex(newHex);
													} else if (
														newHex.startsWith("#") &&
														newHex.length <= 7
													) {
														setColor((prev) => ({
															...prev,
															hex: newHex,
														}));
													}
												}}
											/>
										</div>
										{enableAlpha && (
											<div className="mt-2">
												<Label htmlFor="alpha-input">Alpha (%)</Label>
												<Input
													id="alpha-input"
													type="number"
													min="0"
													max="100"
													value={alpha}
													onChange={(e) => {
														const newAlpha = Math.max(
															0,
															Math.min(100, Number(e.target.value))
														);
														updateAlpha(newAlpha);
													}}
												/>
											</div>
										)}
									</TabsContent>
								)}

								{formats.includes("rgb") && (
									<TabsContent value="rgb" className="mt-2">
										<div className="flex flex-col gap-2">
											<div className="grid grid-cols-3 gap-2">
												<div>
													<Label htmlFor="rgb-r">R</Label>
													<Input
														id="rgb-r"
														type="number"
														min="0"
														max="255"
														value={color.rgb[0]}
														onChange={(e) => {
															const r = Math.max(
																0,
																Math.min(
																	255,
																	Number(e.target.value)
																)
															);
															updateFromRgb([
																r,
																color.rgb[1],
																color.rgb[2],
															]);
														}}
													/>
												</div>
												<div>
													<Label htmlFor="rgb-g">G</Label>
													<Input
														id="rgb-g"
														type="number"
														min="0"
														max="255"
														value={color.rgb[1]}
														onChange={(e) => {
															const g = Math.max(
																0,
																Math.min(
																	255,
																	Number(e.target.value)
																)
															);
															updateFromRgb([
																color.rgb[0],
																g,
																color.rgb[2],
															]);
														}}
													/>
												</div>
												<div>
													<Label htmlFor="rgb-b">B</Label>
													<Input
														id="rgb-b"
														type="number"
														min="0"
														max="255"
														value={color.rgb[2]}
														onChange={(e) => {
															const b = Math.max(
																0,
																Math.min(
																	255,
																	Number(e.target.value)
																)
															);
															updateFromRgb([
																color.rgb[0],
																color.rgb[1],
																b,
															]);
														}}
													/>
												</div>
											</div>
											{enableAlpha && (
												<div>
													<Label htmlFor="rgb-a">Alpha (%)</Label>
													<Input
														id="rgb-a"
														type="number"
														min="0"
														max="100"
														value={alpha}
														onChange={(e) => {
															const newAlpha = Math.max(
																0,
																Math.min(
																	100,
																	Number(e.target.value)
																)
															);
															updateAlpha(newAlpha);
														}}
													/>
												</div>
											)}
										</div>
									</TabsContent>
								)}

								{formats.includes("hsl") && (
									<TabsContent value="hsl" className="mt-2">
										<div className="flex flex-col gap-2">
											<div className="grid grid-cols-3 gap-2">
												<div>
													<Label htmlFor="hsl-h">H</Label>
													<Input
														id="hsl-h"
														type="number"
														min="0"
														max="360"
														value={color.hsl[0]}
														onChange={(e) => {
															const h = Math.max(
																0,
																Math.min(
																	360,
																	Number(e.target.value)
																)
															);
															updateFromHsl([
																h,
																color.hsl[1],
																color.hsl[2],
															]);
														}}
													/>
												</div>
												<div>
													<Label htmlFor="hsl-s">S (%)</Label>
													<Input
														id="hsl-s"
														type="number"
														min="0"
														max="100"
														value={color.hsl[1]}
														onChange={(e) => {
															const s = Math.max(
																0,
																Math.min(
																	100,
																	Number(e.target.value)
																)
															);
															updateFromHsl([
																color.hsl[0],
																s,
																color.hsl[2],
															]);
														}}
													/>
												</div>
												<div>
													<Label htmlFor="hsl-l">L (%)</Label>
													<Input
														id="hsl-l"
														type="number"
														min="0"
														max="100"
														value={color.hsl[2]}
														onChange={(e) => {
															const l = Math.max(
																0,
																Math.min(
																	100,
																	Number(e.target.value)
																)
															);
															updateFromHsl([
																color.hsl[0],
																color.hsl[1],
																l,
															]);
														}}
													/>
												</div>
											</div>
											{enableAlpha && (
												<div>
													<Label htmlFor="hsl-a">Alpha (%)</Label>
													<Input
														id="hsl-a"
														type="number"
														min="0"
														max="100"
														value={alpha}
														onChange={(e) => {
															const newAlpha = Math.max(
																0,
																Math.min(
																	100,
																	Number(e.target.value)
																)
															);
															updateAlpha(newAlpha);
														}}
													/>
												</div>
											)}
										</div>
									</TabsContent>
								)}
							</Tabs>
						) : null}
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}

export const ColorPickerDemo = () => {
	const [color, setColor] = React.useState("#3b82f6");
	const [color2, setColor2] = React.useState("#3b82f680");
	const [color3, setColor3] = React.useState("#ff4500");

	return (
		<div className="flex flex-col gap-8 p-6">
			<h1 className="text-2xl font-bold">Color Picker Demo</h1>

			<div className="flex flex-col gap-4">
				<h2 className="text-xl font-semibold">Standard Color Picker</h2>
				<div className="flex items-center gap-4">
					<ColorPicker value={color} onChange={setColor} />
					<div className="text-sm">Selected color: {color}</div>
				</div>
				<div
					className="h-16 w-full rounded-md transition-colors duration-300"
					style={{ backgroundColor: color }}
				/>
			</div>

			<div className="flex flex-col gap-4">
				<h2 className="text-xl font-semibold">With Alpha Channel</h2>
				<div className="flex items-center gap-4">
					<ColorPicker value={color2} onChange={setColor2} enableAlpha />
					<div className="text-sm">Selected color: {color2}</div>
				</div>
				<div className="relative h-16 w-full rounded-md">
					<div
						className="absolute inset-0 rounded-md"
						style={{
							backgroundImage:
								"linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
							backgroundSize: "20px 20px",
							backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
						}}
					/>
					<div
						className="absolute inset-0 rounded-md transition-colors duration-300"
						style={{
							backgroundColor: color2.slice(0, 7),
							opacity: parseInt(color2.slice(7), 16) / 255,
						}}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-4">
				<h2 className="text-xl font-semibold">RGB Format Only</h2>
				<div className="flex items-center gap-4">
					<ColorPicker value={color3} onChange={setColor3} formats={["rgb"]} />
					<div className="text-sm">Selected color: {color3}</div>
				</div>
				<div
					className="h-16 w-full rounded-md transition-colors duration-300"
					style={{ backgroundColor: color3 }}
				/>
			</div>
		</div>
	);
};
