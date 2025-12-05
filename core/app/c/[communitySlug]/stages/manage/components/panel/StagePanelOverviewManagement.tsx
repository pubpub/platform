"use client"

import type { StagesId } from "db/public"

import Link from "next/link"
import { Copy, Trash2 } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"

import { Button } from "ui/button"

import { useStages } from "../../StagesContext"
import { StageDeletionDialog } from "./StageDeletionDialog"

type Props = {
	onDelete(): void
	stageId: StagesId
	communitySlug: string
}

export const StagePanelOverviewManagement = (props: Props) => {
	const [, setCurrentlyEditingStageId] = useQueryState("currentlyEditingStageId", parseAsString)
	const { duplicateStages } = useStages()
	const onDeleteClick = () => {
		props.onDelete()
		// close sheet
		setCurrentlyEditingStageId(null)
	}

	return (
		<>
			<h4 className="mb-2 font-medium text-base">Stage Management</h4>
			<div className="flex flex-col gap-2">
				<Button variant="ghost" asChild>
					<Link
						className="flex items-center gap-2 hover:underline"
						href={`/c/${props.communitySlug}/stages/${props.stageId}`}
					>
						Visit this stage
					</Link>
				</Button>
				<div className="flex w-full items-center gap-2">
					<Button
						variant="secondary"
						onClick={() => duplicateStages([props.stageId])}
						className="grow"
					>
						<Copy size={16} />
						Duplicate
					</Button>
					<StageDeletionDialog onDeleteClick={onDeleteClick}>
						<Button variant="destructive" className="grow">
							<Trash2 size={16} />
							Delete
						</Button>
					</StageDeletionDialog>
				</div>
			</div>
		</>
	)
}
