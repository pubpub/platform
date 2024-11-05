"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SidebarMenuButton, SidebarMenuSubButton } from "ui/sidebar";

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
		</Link>
	);

	return isChild ? (
		<SidebarMenuSubButton isActive={isActive} asChild>
			{content}
		</SidebarMenuSubButton>
	) : (
		<SidebarMenuButton isActive={isActive} asChild>
			{content}
		</SidebarMenuButton>
	);
}
