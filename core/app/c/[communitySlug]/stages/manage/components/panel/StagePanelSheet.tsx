"use client"

import type { PropsWithChildren } from "react"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "ui/sheet"

type Props = PropsWithChildren<{
	open: boolean
}>

export const StagePanelSheet = (props: Props) => {
	const [open, setOpen] = useState(false)
	const router = useRouter()
	const pathname = usePathname()
	const onOpenChange = (open: boolean) => {
		if (!open) {
			router.push(pathname!)
		}
	}

	useEffect(() => {
		setOpen(props.open)
	}, [props.open])

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetHeader className="sr-only">
				<SheetTitle>Stage edit panel</SheetTitle>
				<SheetDescription>Edit the stage settings and actions.</SheetDescription>
			</SheetHeader>
			<SheetContent className="[&>button]:!top-8 [&>button]:!right-6 w-screen overflow-y-auto p-6 sm:max-w-lg">
				<SheetTitle className="sr-only">Edit Stage</SheetTitle>
				{props.children}
			</SheetContent>
		</Sheet>
	)
}
