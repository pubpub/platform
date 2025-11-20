"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = React.forwardRef<
	React.ElementRef<typeof TooltipPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ ...props }, ref) => <TooltipPrimitive.Trigger type="button" ref={ref} {...props} />)

const TooltipContent = React.forwardRef<
	React.ElementRef<typeof TooltipPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & { withArrow?: boolean }
>(({ className, children, sideOffset = 4, withArrow = false, ...props }, ref) => (
	<TooltipPrimitive.Portal>
		<TooltipPrimitive.Content
			ref={ref}
			sideOffset={sideOffset}
			className={cn(
				"fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 animate-in overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-popover-foreground text-sm shadow-md data-[state=closed]:animate-out",
				className
			)}
			{...props}
		>
			{children}
		</TooltipPrimitive.Content>
	</TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
