"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { SidebarMenuButton, SidebarMenuSubButton, useSidebar } from "ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"

type Props = {
	href: string
	text: string
	icon?: React.ReactNode
	count?: number
	isChild?: boolean
	// optional pattern to match the pathname against for showing the active state
	// by default it's `c\\/.*?${href}`
	pattern?: string
	hasChildren?: boolean
	groupName?: string
}

export default function NavLink({
	href,
	groupName,
	text,
	icon,
	count,
	isChild,
	hasChildren,
	pattern,
}: Props) {
	const pathname = usePathname()
	const { state: sideBarState } = useSidebar()
	const regex = React.useMemo(
		() => (pattern ? new RegExp(`c\\/.*?${pattern}`) : new RegExp(href)),
		[pattern, href]
	)

	const isActive = regex.test(pathname)

	const content = (
		<Link href={href} className="relative">
			{icon ? icon : null}
			<span className="flex-auto text-sm transition-opacity group-data-[collapsible=icon]:opacity-0">
				{text}
			</span>
			{count && (
				<span className="rounded-md border border-gray-200 px-2 text-sm">{count}</span>
			)}
		</Link>
	)

	return (
		<Tooltip delayDuration={300} open={sideBarState === "expanded" ? false : undefined}>
			<TooltipTrigger asChild>
				{isChild ? (
					<SidebarMenuSubButton isActive={isActive} asChild>
						{content}
					</SidebarMenuSubButton>
				) : (
					<SidebarMenuButton isActive={isActive} asChild>
						{content}
					</SidebarMenuButton>
				)}
			</TooltipTrigger>

			<TooltipContent side="right">
				<p className="text-xs">{groupName ? `${groupName} - ${text}` : text}</p>
			</TooltipContent>
		</Tooltip>
	)
}
