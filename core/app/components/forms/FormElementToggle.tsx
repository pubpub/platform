"use client"

import type { PropsWithChildren } from "react"

import { Minus, Plus } from "lucide-react"

import { Toggle } from "ui/toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"
import { cn } from "utils"

import { useFormElementToggleContext } from "./FormElementToggleContext"

export const FormElementToggle = (props: PropsWithChildren<{ slug: string }>) => {
	const formElementToggle = useFormElementToggleContext()
	const isEnabled = formElementToggle.isEnabled(props.slug)
	return (
		<div className="flex items-baseline gap-1">
			<Tooltip delayDuration={500}>
				<TooltipTrigger asChild>
					<Toggle
						aria-label="Toggle field"
						data-testid={`${props.slug}-toggle`}
						className={cn(
							"group top-2 z-20 h-3 w-3 min-w-3 rounded-full p-0 text-muted-foreground data-[state=off]:bg-border",
							isEnabled ? "bg-accent/80" : "bg-border"
							// isEnabled ? "text-accent-foreground" : "text-muted-foreground"
						)}
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
				<TooltipContent>
					{isEnabled ? "Disable" : "Enable"}{" "}
					<span className="font-mono">{props.slug}</span>
				</TooltipContent>
			</Tooltip>
			<div className="w-full">{props.children}</div>
		</div>
	)
}
