"use client";

import type { ReactNode } from "react";

import { useState, useTransition } from "react";
import Link from "next/link";

import type { PubsId, StagesId } from "db/public";
import { Button } from "ui/button";
import { ArrowLeft, ArrowRight, FlagTriangleRightIcon, Loader2 } from "ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { useToast } from "ui/use-toast";

import type { CommunityStage } from "~/lib/server/stages";
import type { XOR } from "~/lib/types";
import { move } from "~/app/c/[communitySlug]/stages/components/lib/actions";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { isClientException, useServerAction } from "~/lib/serverActions";
import { makeStagesById } from "~/lib/stages";

type Props = {
	pubId: PubsId;
	stageId: StagesId;
	button?: ReactNode;
} & XOR<
	{ communityStages: CommunityStage[] },
	{
		moveFrom: CommunityStage["moveConstraintSources"];
		moveTo: CommunityStage["moveConstraints"];
	}
>;

const makeSourcesAndDestinations = (props: Props) => {
	if (!props.communityStages) {
		return {
			sources: props.moveFrom,
			destinations: props.moveTo,
		};
	}

	const stagesById = makeStagesById(props.communityStages);
	const stage = stagesById[props.stageId];
	const sources = stage ? stage.moveConstraintSources.map((mc) => stagesById[mc.id]) : [];
	const destinations = stage ? stage.moveConstraints.map((mc) => stagesById[mc.id]) : [];

	return {
		sources,
		destinations,
	};
};

export default function Move(props: Props) {
	const { sources, destinations } = makeSourcesAndDestinations(props);

	const [popoverIsOpen, setPopoverIsOpen] = useState(false);
	const { toast } = useToast();
	const community = useCommunity();

	const [isMoving, startTransition] = useTransition();
	const runMove = useServerAction(move);

	const onMove = async (pubId: PubsId, sourceStageId: StagesId, destStageId: StagesId) => {
		const err = await runMove(pubId, sourceStageId, destStageId);

		if (isClientException(err)) {
			setPopoverIsOpen(false);
			return;
		}

		toast({
			title: "Success",
			description: "Pub was successfully moved",
			variant: "default",
			action: (
				<Button
					onClick={async () => {
						const result = await runMove(pubId, destStageId, sourceStageId);

						if (isClientException(result)) {
							return;
						}
						toast({
							variant: "default",
							title: "Success",
							description: "Pub was successfully moved back",
						});
					}}
				>
					Undo
				</Button>
			),
		});
		setPopoverIsOpen(false);
	};

	if (destinations.length === 0 && sources.length === 0) {
		return null;
	}

	return (
		<Popover open={popoverIsOpen} onOpenChange={setPopoverIsOpen}>
			<PopoverTrigger asChild>
				{props.button ?? (
					<Button size="sm" variant="outline" disabled={isMoving}>
						{isMoving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Move"}
					</Button>
				)}
			</PopoverTrigger>
			<PopoverContent side="bottom" className="w-fit p-[5px]">
				<div className="flex flex-col gap-x-4">
					{sources.length > 0 && (
						<div className="flex flex-col gap-y-2" data-testid="sources">
							{sources.map((stage) => {
								return stage.id === props.stageId ? null : (
									<Button
										disabled={isMoving}
										variant="ghost"
										key={stage.id}
										onClick={() =>
											startTransition(async () => {
												await onMove(props.pubId, props.stageId, stage.id);
											})
										}
										className="flex w-full justify-start gap-x-2 px-2 py-0"
									>
										<ArrowLeft strokeWidth="1px" />
										<span className="overflow-clip text-ellipsis whitespace-nowrap">
											Move to {stage.name}
										</span>
									</Button>
								);
							})}
						</div>
					)}

					{destinations.length > 0 && (
						<div className="flex flex-col gap-y-2" data-testid="destinations">
							{destinations.map((stage) => {
								return stage.id === props.stageId ? null : (
									<Button
										variant="ghost"
										disabled={isMoving}
										key={stage.id}
										onClick={() =>
											startTransition(async () => {
												await onMove(props.pubId, props.stageId, stage.id);
											})
										}
										className="flex w-full justify-start gap-x-2 px-2 py-0"
									>
										<ArrowRight strokeWidth="1px" />
										<span className="overflow-clip text-ellipsis whitespace-nowrap">
											Move to {stage.name}
										</span>
									</Button>
								);
							})}
						</div>
					)}

					<div>
						<Button
							disabled={isMoving}
							variant="ghost"
							className="w-full justify-start px-2 py-0"
							asChild
						>
							<Link
								href={`/c/${community.slug}/stages/${props.stageId}`}
								className="block flex w-full gap-x-2"
							>
								<FlagTriangleRightIcon strokeWidth="1px" />
								<span>View Stage</span>
							</Link>
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
