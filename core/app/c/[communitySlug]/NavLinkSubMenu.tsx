"use client";

import { useEffect, useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible";
import { useLocalStorage } from "ui/hooks";
import { ChevronDown } from "ui/icon";
import {
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubItem,
	useSidebar,
} from "ui/sidebar";

import type { LinkDefinition } from "./SideNav";
import type { DefinitelyHas } from "~/lib/types";
import NavLink from "./NavLink";

export const NavLinkSubMenu = ({
	link,
	communityPrefix,
}: {
	link: DefinitelyHas<LinkDefinition, "children">;
	communityPrefix: string;
}) => {
	const [open, persistOpen] = useLocalStorage<boolean>(`nav-link-sub-menu-open-${link.href}`);
	const [actuallyOpen, setActuallyOpen] = useState(false);
	const { setOpen: setSidebarOpen, state: sidebarState, open: sidebarOpen } = useSidebar();

	useEffect(() => {
		// necessary bc otherwise we get annoying hydration errors
		setActuallyOpen(open ?? false);
	}, [open]);

	return (
		<SidebarMenu>
			<Collapsible
				key={link.href}
				onOpenChange={(open) => {
					persistOpen(open);
					setActuallyOpen(open);
				}}
				defaultOpen={false}
				open={actuallyOpen}
				className="group/collapsible"
			>
				<SidebarMenuItem className="list-none">
					<CollapsibleTrigger asChild>
						{link.href ? (
							<NavLink
								href={`${communityPrefix}${link.href}`}
								text={link.text}
								icon={link.icon}
								pattern={link.pattern}
								hasChildren
								isChild={false}
							/>
						) : (
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
								{link.icon}
								<span className="flex-auto text-sm">{link.text}</span>
								<ChevronDown className="h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden group-data-[state=closed]/collapsible:-rotate-90" />
							</SidebarMenuButton>
						)}

						{/* <SidebarMenuAction> */}
						{/* </SidebarMenuAction> */}
					</CollapsibleTrigger>
				</SidebarMenuItem>
				<CollapsibleContent>
					<SidebarMenuSub className="group-data-[collapsible=icon]:hidden">
						{link.children.map((child) => (
							<SidebarMenuSubItem key={child.href}>
								<NavLink
									href={`${communityPrefix}${child.href}`}
									text={child.text}
									pattern={child.pattern}
									isChild
								/>
							</SidebarMenuSubItem>
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenu>
	);
};
