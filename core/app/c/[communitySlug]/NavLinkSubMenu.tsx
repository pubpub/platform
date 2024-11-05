"use client";

import { useEffect, useState } from "react";

import { Collapsible, CollapsibleContent } from "ui/collapsible";
import { useLocalStorage } from "ui/hooks";
import { SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem } from "ui/sidebar";

import type { LinkDefinition } from "./SideNav";
import type { DefinitelyHas } from "~/lib/types";
import NavLink from "./NavLink";

export const NavLinkSubMenu = ({
	link,
	prefix,
}: {
	link: DefinitelyHas<LinkDefinition, "children">;
	prefix: string;
}) => {
	const [open, persistOpen] = useLocalStorage<boolean>(`nav-link-sub-menu-open-${link.href}`);
	const [actuallyOpen, setActuallyOpen] = useState(false);

	useEffect(() => {
		// necessary bc otherwise we get annoying hydration errors
		setActuallyOpen(open ?? false);
	}, [open]);

	return (
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
			<SidebarMenuItem>
				<NavLink
					href={`${prefix}${link.href}`}
					text={link.text}
					icon={link.icon}
					pattern={link.pattern}
					hasChildren
				/>
				<CollapsibleContent>
					<SidebarMenuSub className="group-data-[collapsible=icon]:hidden">
						{link.children.map((child) => (
							<SidebarMenuSubItem key={child.href}>
								<NavLink
									href={`${prefix}${child.href}`}
									text={child.text}
									icon={child.icon}
									pattern={child.pattern}
									isChild
								/>
							</SidebarMenuSubItem>
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	);
};
