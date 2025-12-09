"use client"

import type { PubsId, StagesId } from "db/public"
import type { ReactNode } from "react"

import { useState, useTransition } from "react"
import Link from "next/link"

import { Button } from "ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu"
import { ArrowLeft, ArrowRight, FlagTriangleRightIcon } from "ui/icon"
import { useToast } from "ui/use-toast"

import { move } from "~/app/c/[communitySlug]/stages/components/lib/actions"
import { useCommunity } from "~/app/components/providers/CommunityProvider"
import { isClientException, useServerAction } from "~/lib/serverActions"

type SimplifiedStage = {
	id: StagesId
	name: string
}

type Props = {
	pubId: PubsId
	stageId: StagesId
	sources: SimplifiedStage[]
	destinations: SimplifiedStage[]
	canMovePub: boolean
	canViewStage: boolean
	button: ReactNode
	hideIfNowhereToMove: boolean
}

export function MoveInteractive({
	pubId,
	stageId,
	sources,
	destinations,
	canMovePub,
	canViewStage,
	button,
	hideIfNowhereToMove,
}: Props) {
	const [popoverIsOpen, setPopoverIsOpen] = useState(false)
	const { toast } = useToast()
	const community = useCommunity()

	const [isMoving, startTransition] = useTransition()
	const runMove = useServerAction(move)

	const onMove = async (pubId: PubsId, sourceStageId: StagesId, destStageId: StagesId) => {
		const err = await runMove(pubId, sourceStageId, destStageId)

		if (isClientException(err)) {
			setPopoverIsOpen(false)
			return
		}

		toast({
			title: "Success",
			description: "Pub was successfully moved",
			variant: "default",
			action: (
				<Button
					onClick={async () => {
						const result = await runMove(pubId, destStageId, sourceStageId)

						if (isClientException(result)) {
							return
						}
						toast({
							variant: "default",
							title: "Success",
							description: "Pub was successfully moved back",
						})
					}}
				>
					Undo
				</Button>
			),
		})
		setPopoverIsOpen(false)
	}

	if (!canMovePub || !canViewStage) {
		return button
	}

	if (destinations.length === 0 && sources.length === 0 && hideIfNowhereToMove) {
		return button
	}

	return (
		<DropdownMenu open={popoverIsOpen} onOpenChange={setPopoverIsOpen}>
			<DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
			<DropdownMenuContent side="bottom" className="w-fit p-[5px]" align="start">
				<div className="flex flex-col gap-x-4">
					{canMovePub && sources.length > 0 && (
						<div className="flex flex-col" data-testid="sources">
							{sources.map((stage) => {
								return stage.id === stageId ? null : (
									<DropdownMenuItem
										disabled={isMoving}
										key={stage.id}
										onClick={() =>
											startTransition(async () => {
												await onMove(pubId, stageId, stage.id)
											})
										}
									>
										<ArrowLeft size={14} className="size-4" />
										<span className="overflow-clip text-ellipsis whitespace-nowrap">
											Move to {stage.name}
										</span>
									</DropdownMenuItem>
								)
							})}
						</div>
					)}

					{canMovePub && destinations.length > 0 && (
						<div className="flex flex-col" data-testid="destinations">
							{destinations.map((stage) => {
								return stage.id === stageId ? null : (
									<DropdownMenuItem
										disabled={isMoving}
										key={stage.id}
										onClick={() =>
											startTransition(async () => {
												await onMove(pubId, stageId, stage.id)
											})
										}
									>
										<ArrowRight size={14} className="size-4" />
										<span className="overflow-clip text-ellipsis whitespace-nowrap">
											Move to {stage.name}
										</span>
									</DropdownMenuItem>
								)
							})}
						</div>
					)}

					{canViewStage && (
						<div>
							<DropdownMenuItem disabled={isMoving} asChild>
								<Link
									href={`/c/${community.slug}/stages/${stageId}`}
									className="flex w-full gap-x-2"
								>
									<FlagTriangleRightIcon size={14} className="size-4" />
									<span>View Stage</span>
								</Link>
							</DropdownMenuItem>
						</div>
					)}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
