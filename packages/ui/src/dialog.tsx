"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black bg-opacity-50">
			<DialogPrimitive.Content
				ref={ref}
				className={cn(
					"fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-md shadow-md p-4 outline-none",
					className
				)}
				{...props}
			/>
		</DialogPrimitive.Overlay>
	</DialogPrimitive.Portal>
));

DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;
const DialogClose = DialogPrimitive.Close;
export { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose };
