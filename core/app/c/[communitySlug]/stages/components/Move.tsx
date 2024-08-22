"use client";

import { Button } from "ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { useToast } from "ui/use-toast";

import type { PubPayload, StagePayload, StagePayloadMoveConstraintDestination } from "~/lib/types";
import { isClientException, useServerAction } from "~/lib/serverActions";
import { move } from "./lib/actions";

type Props = {
	moveFrom?: StagePayloadMoveConstraintDestination[];
	moveTo?: StagePayloadMoveConstraintDestination[];
	pub: PubPayload;
	stage: StagePayload;
};

export default function Move(props: Props) {
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
					{props.moveTo && (
						<>
							<div className="mb-4 text-center font-bold">Move this Pub to:</div>
							{props.moveTo.map((stage) => {
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
					{props.moveFrom && (
						<>
							<div className="mb-4 text-center font-bold">Move this Pub back to:</div>
							{props.moveFrom.map((stage) => {
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
