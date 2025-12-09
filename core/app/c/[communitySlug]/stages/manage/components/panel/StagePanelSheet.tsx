"use client"

import type { PropsWithChildren } from "react"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "ui/sheet"

import { useStages } from "../../StagesContext"
import { useClosePanel, useEditingStageId } from "./usePanelQueryParams"

type Props = PropsWithChildren<{
	defaultOpen?: boolean
}>

const generateMaskPath = (coords: { x: number; y: number; width: number; height: number }) => {
	const { x, y, width, height } = coords
	const radius = 14
	const handleRadius = 8
	const vw = typeof window !== "undefined" ? window.innerWidth : 10000
	const vh = typeof window !== "undefined" ? window.innerHeight : 10000
	const centerY = y + height / 2

	return `path(evenodd, "M 0 0 L ${vw} 0 L ${vw} ${vh} L 0 ${vh} Z M ${x + radius} ${y} L ${x + width - radius} ${y} Q ${x + width} ${y} ${x + width} ${y + radius} L ${x + width} ${centerY - handleRadius} A ${handleRadius} ${handleRadius} 0 0 1 ${x + width} ${centerY + handleRadius} L ${x + width} ${y + height - radius} Q ${x + width} ${y + height} ${x + width - radius} ${y + height} L ${x + radius} ${y + height} Q ${x} ${y + height} ${x} ${y + height - radius} L ${x} ${centerY + handleRadius} A ${handleRadius} ${handleRadius} 0 0 1 ${x} ${centerY - handleRadius} L ${x} ${y + radius} Q ${x} ${y} ${x + radius} ${y} Z")`
}

export const StagePanelSheet = (props: Props) => {
	const { editingStageId } = useEditingStageId()
	const closePanel = useClosePanel()
	const onOpenChange = (open: boolean) => {
		if (!open) {
			closePanel()
		}
	}

	const { activeStageCooridnates } = useStages()

	const maskStyle =
		editingStageId && activeStageCooridnates
			? { clipPath: generateMaskPath(activeStageCooridnates) }
			: undefined

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
			<SheetContent
				className="[&>button]:!top-5 [&>button]:!right-4 md:[&>button]:!top-8 md:[&>button]:!right-6 w-screen overflow-y-auto border-none bg-transparent p-2 shadow-none sm:max-w-lg md:p-6"
				overlayStyle={maskStyle}
			>
				<SheetTitle className="sr-only">Edit Stage</SheetTitle>
				{props.children}
			</SheetContent>
		</Sheet>
	)
}
