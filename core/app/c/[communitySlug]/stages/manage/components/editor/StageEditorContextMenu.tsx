"use client"

import type { PropsWithChildren } from "react"

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from "ui/context-menu"

import { useStages } from "../../StagesContext"
import { StageDeletionDialog } from "../panel/StageDeletionDialog"
import { useStageEditor } from "./StageEditorContext"

export const StageEditorContextMenu = (props: PropsWithChildren) => {
	const { createStage, duplicateStages } = useStages()
	const { deleteSelection, hasSelection, selectedStages } = useStageEditor()

	return (
		<ContextMenu>
			<ContextMenuTrigger>{props.children}</ContextMenuTrigger>
			<ContextMenuContent className="w-64">
				<StageDeletionDialog onDeleteClick={deleteSelection}>
					<ContextMenuItem
						// so it doesn't close the context menu
						onSelect={(e) => e.preventDefault()}
						inset
						disabled={!hasSelection}
					>
						Delete
					</ContextMenuItem>
				</StageDeletionDialog>
				<ContextMenuSeparator />
				<ContextMenuItem
					inset
					disabled={!hasSelection}
					onClick={() => duplicateStages(selectedStages.map((s) => s.id))}
				>
					Duplicate
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem inset onClick={createStage}>
					New Stage
					<ContextMenuShortcut>^N</ContextMenuShortcut>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}
