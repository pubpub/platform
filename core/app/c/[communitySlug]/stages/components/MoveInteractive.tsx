"use client"

import type { PubsId, StagesId } from "db/public"
import type { ReactNode } from "react"

import { useState, useTransition } from "react"
import Link from "next/link"

import { Button } from "ui/button"
import { ArrowLeft, ArrowRight, FlagTriangleRightIcon } from "ui/icon"
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover"
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
		<Popover open={popoverIsOpen} onOpenChange={setPopoverIsOpen}>
			<PopoverTrigger asChild>{button}</PopoverTrigger>
			<PopoverContent side="bottom" className="w-fit p-[5px]" align="start">
				<div className="flex flex-col gap-x-4">
					{canMovePub && sources.length > 0 && (
						<div className="flex flex-col" data-testid="sources">
							{sources.map((stage) => {
								return stage.id === stageId ? null : (
									<Button
										disabled={isMoving}
										variant="ghost"
										key={stage.id}
										onClick={() =>
											startTransition(async () => {
												await onMove(pubId, stageId, stage.id)
											})
										}
										className="flex w-full justify-start gap-x-2 px-2 py-0"
									>
										<ArrowLeft strokeWidth="1px" />
										<span className="overflow-clip text-ellipsis whitespace-nowrap">
											Move to {stage.name}
										</span>
									</Button>
								)
							})}
						</div>
					)}

					{canMovePub && destinations.length > 0 && (
						<div className="flex flex-col" data-testid="destinations">
							{destinations.map((stage) => {
								return stage.id === stageId ? null : (
									<Button
										variant="ghost"
										disabled={isMoving}
										key={stage.id}
										onClick={() =>
											startTransition(async () => {
												await onMove(pubId, stageId, stage.id)
											})
										}
										className="flex w-full justify-start gap-x-2 px-2 py-0"
									>
										<ArrowRight strokeWidth="1px" />
										<span className="overflow-clip text-ellipsis whitespace-nowrap">
											Move to {stage.name}
										</span>
									</Button>
								)
							})}
						</div>
					)}

					{canViewStage && (
						<div>
							<Button
								disabled={isMoving}
								variant="ghost"
								className="w-full justify-start px-2 py-0"
								asChild
							>
								<Link
									href={`/c/${community.slug}/stages/${stageId}`}
									className="block flex w-full gap-x-2"
								>
									<FlagTriangleRightIcon strokeWidth="1px" />
									<span>View Stage</span>
								</Link>
							</Button>
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	)
}
