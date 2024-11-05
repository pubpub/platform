"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";

import { CollapsibleTrigger } from "ui/collapsible";
import { DropdownMenuTrigger } from "ui/dropdown-menu";
import { useLocalStorage } from "ui/hooks";
import { ChevronDown } from "ui/icon";
import { SidebarMenuButton, SidebarMenuSubButton } from "ui/sidebar";
import { cn } from "utils";

type Props = {
	href: string;
	text: string;
	icon: React.ReactNode;
	count?: number;
	isChild?: boolean;
	// optional pattern to match the pathname against for showing the active state
	// by default it's `c\\/.*?${href}`
	pattern?: string;
	hasChildren?: boolean;
};

export default function NavLink({ href, text, icon, count, isChild, hasChildren, pattern }: Props) {
	const pathname = usePathname();

	const regex = React.useMemo(
		() => (pattern ? new RegExp(`c\\/.*?${pattern}`) : new RegExp(href)),
		[pattern, href]
	);

	const isActive = regex.test(pathname);

	const content = (
		<Link href={href} className="relative">
			{icon}
			<div className="flex-auto text-sm">{text}</div>
			{count && <div className="rounded-md border border-gray-200 px-2 text-sm">{count}</div>}
			{/**
			 * dropdown button for submenus
			 */}
			{hasChildren && (
				<CollapsibleTrigger className="absolute right-2 z-10 flex h-full w-8 items-center justify-center">
					<ChevronDown className="h-4 w-4 group-data-[collapsible=icon]:hidden" />
				</CollapsibleTrigger>
			)}
		</Link>
	);

	return isChild ? (
		<SidebarMenuSubButton asChild isActive={isActive}>
			{content}
		</SidebarMenuSubButton>
	) : (
		<SidebarMenuButton asChild isActive={isActive}>
			{content}
		</SidebarMenuButton>
	);
}
