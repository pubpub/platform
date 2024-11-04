"use client";

import { useState, useTransition } from "react";

import type { PubsId, Stages, StagesId } from "db/public";
import { Button } from "ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { useToast } from "ui/use-toast";

import type { CommunityStage } from "~/lib/server/stages";
import type { XOR } from "~/lib/types";
import { isClientException, useServerAction } from "~/lib/serverActions";
import { makeStagesById } from "~/lib/stages";
import { move } from "./lib/actions";

type Props = {
	pubId: PubsId;
	stageId: StagesId;
} & XOR<
	{ communityStages: CommunityStage[] },
	{
		moveFrom: Stages[];
		moveTo: Stages[];
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
	const sources = stagesById[props.stageId].moveConstraintSources.map(
		(mc) => stagesById[mc.stageId]
	);
	const destinations = stagesById[props.stageId].moveConstraints.map(
		(mc) => stagesById[mc.destinationId]
	);

	return {
		sources,
		destinations,
	};
};

export default function Move(props: Props) {
	const { sources, destinations } = makeSourcesAndDestinations(props);

	const [popoverIsOpen, setPopoverIsOpen] = useState(false);
	const { toast } = useToast();

	const [isMoving, startTransition] = useTransition();
	const runMove = useServerAction(move);

	const onMove = async (pubId: string, sourceStageId: string, destStageId: string) => {
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
				<Button size="sm" variant="outline" disabled={isMoving}>
					{isMoving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Move"}
				</Button>
			</PopoverTrigger>
			<PopoverContent side="left" className="w-fit">
				<div className="flex gap-x-4">
					{sources.length > 0 && (
						<div className="flex flex-col gap-y-2" data-testid="sources">
							<div className="flex items-center justify-start gap-x-2">
								<span className="text-sm font-bold">Move back</span>
							</div>
							{sources.map((stage) => {
								return stage.id === props.stageId ? null : (
									<Button
										disabled={isMoving}
										variant="outline"
										key={stage.id}
										onClick={() =>
											startTransition(async () => {
												await onMove(props.pubId, props.stageId, stage.id);
											})
										}
										className="flex justify-start gap-x-1"
									>
										<ArrowLeft className="h-4 w-4 shrink-0 opacity-50" />
										<span className="overflow-clip text-ellipsis whitespace-nowrap">
											{stage.name}
										</span>
									</Button>
								);
							})}
						</div>
					)}

					{destinations.length > 0 && (
						<div className="flex flex-col gap-y-2" data-testid="destinations">
							<div className="flex items-center justify-start gap-x-2">
								<span className="text-sm font-bold">Move to</span>
							</div>
							{destinations.map((stage) => {
								return stage.id === props.stageId ? null : (
									<Button
										variant="outline"
										disabled={isMoving}
										key={stage.id}
										onClick={() =>
											startTransition(async () => {
												await onMove(props.pubId, props.stageId, stage.id);
											})
										}
										className="flex justify-start gap-x-1"
									>
										<span className="overflow-clip text-ellipsis whitespace-nowrap">
											{stage.name}
										</span>
										<ArrowRight className="h-4 w-4 shrink-0 opacity-50" />
									</Button>
								);
							})}
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
