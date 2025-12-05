"use client"

import type { PropsWithChildren } from "react"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "ui/sheet"

import { useClosePanel, useEditingStageId } from "./usePanelQueryParams"

type Props = PropsWithChildren<{
	defaultOpen?: boolean
}>

export const StagePanelSheet = (props: Props) => {
	const { editingStageId } = useEditingStageId()
	const closePanel = useClosePanel()
	const onOpenChange = (open: boolean) => {
		if (!open) {
			closePanel()
		}
	}

	return (
		<Sheet
			defaultOpen={props.defaultOpen}
			open={Boolean(editingStageId)}
			onOpenChange={onOpenChange}
		>
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
