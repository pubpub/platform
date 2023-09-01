"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "utils";

const TooltipRoot = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const Tooltip = React.forwardRef<
	React.ElementRef<typeof TooltipPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>
>(({ ...props }) => (
	<TooltipPrimitive.Provider>
		<TooltipRoot {...props} />
	</TooltipPrimitive.Provider>
));

const TooltipContent = React.forwardRef<
	React.ElementRef<typeof TooltipPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TooltipPrimitive.Portal>
		<TooltipPrimitive.Content
			ref={ref}
			className={cn(
				"fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-md shadow-md p-4 outline-none",
				className
			)}
			{...props}
		/>
		<TooltipPrimitive.Arrow className="text-white" />
	</TooltipPrimitive.Portal>
));

TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent };
