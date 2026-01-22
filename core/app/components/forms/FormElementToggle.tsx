"use client"

import type { PropsWithChildren } from "react"

import { Minus, Plus } from "lucide-react"

import { Toggle } from "ui/toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"
import { cn } from "utils"

import { useFormElementToggleContext } from "./FormElementToggleContext"

export const FormElementToggle = (
	props: PropsWithChildren<{ slug: string; className?: string }>
) => {
	const formElementToggle = useFormElementToggleContext()
	const isEnabled = formElementToggle.isEnabled(props.slug)
	console.log("isEnabled", isEnabled, props.slug)
	return (
		<div className="relative">
			<Tooltip delayDuration={500}>
				<TooltipTrigger asChild>
					<Toggle
						aria-label="Toggle field"
						data-testid={`${props.slug}-toggle`}
						className={cn(
							"group md:-left-4 absolute top-1 right-0 z-20 h-3 w-3 min-w-3 rounded-full p-0 text-muted-foreground data-[state=off]:bg-border md:right-auto",
							isEnabled
								? "bg-accent/80 text-accent-foreground"
								: "bg-border text-muted-foreground"
						)}
						aria-pressed={isEnabled}
						pressed={isEnabled}
						onClick={() => formElementToggle.toggle(props.slug)}
					>
						{isEnabled ? (
							<Minus
								size={8}
								strokeWidth="1px"
								className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
							/>
						) : (
							<Plus size={8} strokeWidth="1px" />
						)}
					</Toggle>
				</TooltipTrigger>
				<TooltipContent className="text-xs">
					{isEnabled ? "Disable" : "Enable"}{" "}
					<span className="font-mono">{props.slug}</span>
				</TooltipContent>
			</Tooltip>
			<div
				className={cn(
					"w-full",
					isEnabled ? "opacity-100" : "pointer-events-none opacity-50",
					props.className
				)}
			>
				{props.children}
			</div>
		</div>
	)
}
