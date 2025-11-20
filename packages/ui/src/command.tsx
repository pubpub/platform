"use client"

import type { DialogProps } from "@radix-ui/react-dialog"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "utils"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog"

const Command = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
	<CommandPrimitive
		ref={ref}
		className={cn(
			"flex h-full w-full flex-col overflow-hidden bg-white text-gray-950",
			className
		)}
		{...props}
	/>
))
Command.displayName = CommandPrimitive.displayName

interface CommandDialogProps extends DialogProps {
	/**
	 * title is used for accessibility
	 */
	title: string
	/**
	 * description is used for accessibility
	 */
	description: string
	/**
	 * @default false
	 */
	showTitle?: boolean
	/**
	 * @default false
	 */
	showDescription?: boolean
}

const CommandDialog = ({
	children,
	title,
	description,
	showTitle,
	showDescription,
	...props
}: CommandDialogProps) => {
	return (
		<Dialog {...props}>
			<DialogContent className="overflow-hidden p-0 shadow-lg">
				<DialogTitle className={cn(showTitle || "sr-only")}>{title}</DialogTitle>
				<DialogDescription className={cn(showDescription || "sr-only")}>
					{description}
				</DialogDescription>
				<Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
					{children}
				</Command>
			</DialogContent>
		</Dialog>
	)
}

const CommandInput = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Input>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & {
		icon?: React.ReactNode
		wrapperClassName?: string
	}
>(({ className, icon, wrapperClassName, ...props }, ref) => (
	<div
		className={cn(
			"flex items-center rounded-lg border bg-background px-3 focus-within:border-blue-500",
			wrapperClassName,
			props.disabled ? "border-gray-200 bg-gray-200 opacity-50" : "bg-background"
		)}
		cmdk-input-wrapper=""
	>
		{icon ?? <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />}
		<CommandPrimitive.Input
			ref={ref}
			className={cn(
				"flex h-10 w-full rounded-md border-none border-transparent bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
				className
			)}
			{...props}
		/>
	</div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.List
		ref={ref}
		className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
		{...props}
	/>
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Empty>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
	<CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm" {...props} />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Group>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Group
		ref={ref}
		className={cn(
			"overflow-hidden p-1 text-gray-950 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500",
			className
		)}
		{...props}
	/>
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Separator
		ref={ref}
		className={cn("-mx-1 h-px bg-gray-200", className)}
		{...props}
	/>
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Item
		ref={ref}
		className={cn(
			"relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
			className
		)}
		{...props}
	/>
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
	return (
		<span
			className={cn("ml-auto text-xs tracking-widest text-gray-500", className)}
			{...props}
		/>
	)
}
CommandShortcut.displayName = "CommandShortcut"

export {
	Command,
	CommandDialog,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandShortcut,
	CommandSeparator,
}
