"use client"

import type { ComponentProps } from "react"

import { Button, type ButtonProps } from "ui/button"
import { Search } from "ui/icon"
import { SidebarMenuButton } from "ui/sidebar"

import { useSearchDialog } from "./SearchDialogContext"

export function SearchDialogTrigger(props: ButtonProps) {
	const { open } = useSearchDialog()

	return (
		<Button onClick={open} variant="outline" size="sm" {...props}>
			<Search className="h-4 w-4" />
			Search pubs
		</Button>
	)
}

export function SidebarSearchDialogTrigger(props: ComponentProps<typeof SidebarMenuButton>) {
	const { open } = useSearchDialog()

	return (
		<SidebarMenuButton onClick={open} {...props}>
			<Search className="h-4 w-4" />
			Search pubs
		</SidebarMenuButton>
	)
}
