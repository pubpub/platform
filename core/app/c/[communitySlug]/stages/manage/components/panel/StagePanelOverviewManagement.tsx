"use client"

import type { StagesId } from "db/public"

import Link from "next/link"

import { Button } from "ui/button"

type Props = {
	onDelete(): void
	stageId: StagesId
	communitySlug: string
}

export const StagePanelOverviewManagement = (props: Props) => {
	const onDeleteClick = () => {
		props.onDelete()
	}

	return (
		<>
			<h4 className="mb-2 font-semibold">Stage Management</h4>
			<div className="flex gap-2">
				<Button variant="secondary" asChild>
					<Link href={`/c/${props.communitySlug}/stages/${props.stageId}`}>
						Visit this Stage
					</Link>
				</Button>
				<Button variant="secondary" onClick={onDeleteClick}>
					Delete this Stage
				</Button>
			</div>
		</>
	)
}
