import type { ReactNode } from "react";

import { forwardRef } from "react";

import type { ButtonProps } from "ui/button";
import { Button } from "ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "ui/dropdown-menu";
import { Ellipsis } from "ui/icon";
import { cn } from "utils";

/**
 * Menu item that renders as a button. Need forwardRef to pass on asChild
 * or else the menu won't close when the button is clicked
 * */
export const MenuItemButton = forwardRef<HTMLButtonElement, ButtonProps>(
	({ children, className, ...props }, ref) => {
		return (
			<Button
				variant="ghost"
				size="sm"
				className={cn("flex w-full justify-start", className)}
				{...props}
				ref={ref}
			>
				{children}
			</Button>
		);
	}
);

export const TableActionMenu = ({ children }: { children: ReactNode }) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<span className="sr-only">Open menu</span>
					<Ellipsis className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="p-0">
				{children}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
