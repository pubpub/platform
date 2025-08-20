"use client";

import type { ReactNode } from "react";

import { forwardRef } from "react";
import { MoreHorizontal } from "lucide-react";

import type { ButtonProps } from "ui/button";
import { Button } from "ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "ui/dropdown-menu";
import { cn } from "utils";

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
	children: ReactNode;
	triggerClassName?: string;
	contentClassName?: string;
	align?: "start" | "center" | "end";
	side?: "top" | "right" | "bottom" | "left";
	sideOffset?: number;
	triggerSize?: "sm" | "default" | "lg" | "icon";
	disabled?: boolean;
}

/**
 * menu item that renders as a button. need forwardRef to pass on asChild
 * or else the menu won't close when the button is clicked
 */
export const EllipsisMenuButton = forwardRef<HTMLButtonElement, ButtonProps>(
	({ children, className, ...props }, ref) => {
		return (
			<Button
				variant="ghost"
				size="sm"
				className={cn("flex w-full justify-between", className)}
				{...props}
				ref={ref}
			>
				{children}
			</Button>
		);
	}
);

EllipsisMenuButton.displayName = "EllipsisMenuButton";

export const EllipsisMenu = ({
	children,
	triggerClassName,
	contentClassName,
	align = "end",
	side = "bottom",
	sideOffset = 4,
	triggerSize = "sm",
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
						"hover:bg-gray-100 focus:bg-gray-100",
						"transition-colors duration-150",
						triggerClassName
					)}
				>
					<span className="sr-only">Open menu</span>
					<MoreHorizontal className="h-4 w-4" />
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
	);
};
