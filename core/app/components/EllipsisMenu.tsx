"use client"

import type { ComponentProps, ReactNode } from "react"

import { type LucideIcon, MoreHorizontal, MoreVertical } from "lucide-react"

import { Button } from "ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu"
import { cn } from "utils"

/**
 * reusable ellipsis dropdown menu component that works well on mobile
 *
 * usage:
 * <EllipsisMenu>
 *   <EllipsisMenuButton onClick={handleAction}>
 *     Action Item
 *   </EllipsisMenuButton>
 *   <EllipsisMenuButton asChild>
 *     <Link href="/path">Link Item</Link>
 *   </EllipsisMenuButton>
 * </EllipsisMenu>
 */

interface EllipsisMenuProps {
	children: ReactNode
	triggerClassName?: string
	contentClassName?: string
	align?: "start" | "center" | "end"
	side?: "top" | "right" | "bottom" | "left"
	sideOffset?: number
	triggerSize?: "sm" | "default" | "lg" | "icon"
	disabled?: boolean
	/**
	 * use horizontal if the menu represents a truncation of a list of other options, use vertical if the menu is the only list of options
	 * @default "vertical"
	 */
	orientation?: "horizontal" | "vertical"
}

/**
 * menu item that renders as a button. need forwardRef to pass on asChild
 * or else the menu won't close when the button is clicked
 */
export const EllipsisMenuButton = ({
	children,
	className,
	onClick,
	closeOnClick = true,
	...props
}: ComponentProps<typeof DropdownMenuItem> & { closeOnClick?: boolean; icon?: LucideIcon }) => {
	return (
		<DropdownMenuItem
			onClick={(e) => {
				if (!closeOnClick) {
					e.preventDefault()
				}
				onClick?.(e)
			}}
			className={cn("flex w-full justify-start", !props.icon && "pl-8", className)}
			{...props}
		>
			{props.icon ? (
				<>
					<props.icon className="h-3 w-3" />
					{children}
				</>
			) : (
				children
			)}
		</DropdownMenuItem>
	)
}

export const EllipsisMenu = ({
	children,
	triggerClassName,
	contentClassName,
	align = "end",
	side = "bottom",
	sideOffset = 4,
	triggerSize = "sm",
	orientation = "horizontal",
	disabled = false,
}: EllipsisMenuProps) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild disabled={disabled}>
				<Button
					variant="ghost"
					size={triggerSize}
					className={cn(
						"h-8 w-8 p-0",
						"hover:bg-muted focus-visible:bg-muted",
						"transition-colors duration-150",
						triggerClassName
					)}
				>
					<span className="sr-only">Open menu</span>
					{orientation === "horizontal" ? (
						<MoreHorizontal className="h-4 w-4" />
					) : (
						<MoreVertical className="h-4 w-4" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align={align}
				side={side}
				sideOffset={sideOffset}
				className={cn("min-w-[160px] p-1", contentClassName)}
			>
				{children}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
