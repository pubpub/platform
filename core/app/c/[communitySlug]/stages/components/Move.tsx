"use client";

import { Button } from "ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { useToast } from "ui/use-toast";

import type { PubPayload, StagePayload } from "~/lib/server/_legacy-integration-queries";
import { isClientException, useServerAction } from "~/lib/serverActions";
import { makeStagesById } from "~/lib/stages";
import { move } from "./lib/actions";

type Props = {
	pub: PubPayload;
	stage: Pick<StagePayload, "id" | "name">;
	communityStages: StagePayload[];
};

export default function Move(props: Props) {
	const stagesById = makeStagesById(props.communityStages);
	const sources = stagesById[props.stage.id].moveConstraintSources.map(
		(mc) => stagesById[mc.stageId]
	);
	const destinations = stagesById[props.stage.id].moveConstraints.map(
		(mc) => stagesById[mc.destinationId]
	);
	const { toast } = useToast();

	const runMove = useServerAction(move);

	const onMove = async (pubId: string, sourceStageId: string, destStageId: string) => {
		const err = await runMove(pubId, sourceStageId, destStageId);

		if (isClientException(err)) {
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
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button size="sm" variant="outline">
					Move
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<div className="flex flex-col">
					{destinations.length > 0 && (
						<>
							<div className="mb-4 text-center font-bold">Move this Pub to:</div>
							{destinations.map((stage) => {
								return stage.id === props.stage.id ? null : (
									<Button
										variant="ghost"
										key={stage.id}
										onClick={() =>
											onMove(props.pub.id, props.stage.id, stage.id)
										}
										className="mb-2"
									>
										{stage.name}
									</Button>
								);
							})}
						</>
					)}
					{sources.length > 0 && (
						<>
							<div className="mb-4 text-center font-bold">Move this Pub back to:</div>
							{sources.map((stage) => {
								<div className="mb-4">Move this Pub back to:</div>;
								return stage.id === props.stage.id ? null : (
									<Button
										variant="ghost"
										key={stage.id}
										onClick={() =>
											onMove(props.pub.id, props.stage.id, stage.id)
										}
									>
										{stage.name}
									</Button>
								);
							})}
						</>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
