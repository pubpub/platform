"use client"

import type { PropsWithChildren } from "react"

import { XIcon } from "lucide-react"

import {
	Sheet,
	SheetDescription,
	SheetHeader,
	SheetOverlay,
	SheetPortal,
	SheetPrimitive,
	SheetTitle,
} from "ui/sheet"
import { cn } from "utils"

import { useStages } from "../../StagesContext"
import { useClosePanel, useEditingStageId } from "./usePanelQueryParams"

type Props = PropsWithChildren<{
	defaultOpen?: boolean
}>

/**
 * cutout for current editor node, so it appears unblurred if the panel is open, looks cool
 */
const generateMaskPath = (coords: { x: number; y: number; width: number; height: number }) => {
	const { x, y, width, height } = coords
	const baseNodeWidth = 250
	const scale = width / baseNodeWidth
	const radius = 18
	const handleRadius = 2.5 * scale
	const vw = typeof window !== "undefined" ? window.innerWidth : 10000
	const vh = typeof window !== "undefined" ? window.innerHeight : 10000
	const centerY = y + height / 2

	// thank you claude
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
			? { clipPath: generateMaskPath(activeStageCooridnates), pointerEvents: "none" as const }
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
			<StagePanelSheetContent
				className="[&>button]:!top-5 [&>button]:!right-4 md:[&>button]:!top-8 md:[&>button]:!right-6 overflow-y-auto border-none bg-transparent p-2 shadow-none sm:max-w-lg md:max-w-3xl md:p-6"
				overlayStyle={maskStyle}
			>
				<SheetTitle className="sr-only">Edit Stage</SheetTitle>
				{props.children}
			</StagePanelSheetContent>
		</Sheet>
	)
}

function StagePanelSheetContent({
	className,
	children,
	side = "right",
	overlayStyle,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
	side?: "top" | "right" | "bottom" | "left"
	overlayStyle?: React.CSSProperties
}) {
	return (
		<SheetPortal>
			{/* style has a cutout for the current editor node, so it appears unblurred if the panel is open, looks cool */}
			{/* it's also a bit lower of a z-index than a normal overlay, so it doesn't obscure the side panel. otherwsie we have to even more weird trickery to make sure the cutout does not obscure that */}
			<SheetOverlay style={overlayStyle} className="z-30" />
			<SheetPrimitive.Content
				data-slot="sheet-content"
				className={cn(
					"fixed z-50 flex flex-col gap-4 bg-background shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:duration-300 data-[state=open]:duration-500",
					"data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
					className
				)}
				{...props}
			>
				{children}
				<SheetPrimitive.Close className="absolute top-5 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary md:top-8 md:right-6">
					<XIcon className="size-4" />
					<span className="sr-only">Close</span>
				</SheetPrimitive.Close>
			</SheetPrimitive.Content>
		</SheetPortal>
	)
}
