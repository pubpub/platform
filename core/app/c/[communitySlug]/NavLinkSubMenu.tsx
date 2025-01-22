"use client";

import { useEffect, useState } from "react";

import { logger } from "logger";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible";
import { useLocalStorage } from "ui/hooks";
import { ChevronDown } from "ui/icon";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	useSidebar,
} from "ui/sidebar";

export const NavLinkSubMenu = ({
	icon,
	text,
	parentLink,
	children,
}: {
	icon: React.ReactNode;
	text: string;
	parentLink?: React.ReactNode;
	children: React.ReactNode;
}) => {
	const [open, persistOpen] = useLocalStorage<boolean>(`nav-link-sub-menu-open-${text}`);
	const [actuallyOpen, setActuallyOpen] = useState(false);
	const { setOpen: setSidebarOpen, state: sidebarState } = useSidebar();

	useEffect(() => {
		setActuallyOpen(open ?? false);
	}, [open]);

	if (!icon || !text) {
		logger.error({ msg: `NavLinkSubMenu: Missing required props`, icon, text });
		return null;
	}

	return (
		<SidebarMenu>
			<Collapsible
				onOpenChange={(newOpen) => {
					persistOpen(newOpen);
					setActuallyOpen(newOpen);
				}}
				defaultOpen={false}
				open={actuallyOpen}
				className="group/collapsible"
			>
				<SidebarMenuItem className="list-none">
					<CollapsibleTrigger asChild>
						{parentLink ?? (
							<SidebarMenuButton
								className="relative"
								onClick={() => {
									// if we are in "icon" mode, we expand the sidebar if you click on a submenu
									if (sidebarState === "collapsed") {
										setSidebarOpen(true);
										setActuallyOpen(true);
										persistOpen(true);
									}
								}}
							>
								{icon}
								<span className="flex-auto text-sm">{text}</span>
								<ChevronDown className="h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden group-data-[state=closed]/collapsible:-rotate-90" />
							</SidebarMenuButton>
						)}
					</CollapsibleTrigger>
				</SidebarMenuItem>
				<CollapsibleContent>
					<SidebarMenuSub className="group-data-[collapsible=icon]:hidden">
						{children}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenu>
	);
};
