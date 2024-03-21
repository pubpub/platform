"use client";

import { Button } from "ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { useToast } from "ui/use-toast";
import { PubPayload, StagePayload, StagePayloadMoveConstraintDestination } from "~/lib/types";
import { move } from "./lib/actions";

type Props = {
	moveFrom?: StagePayloadMoveConstraintDestination[];
	moveTo?: StagePayloadMoveConstraintDestination[];
	pub: PubPayload;
	stage: StagePayload;
};

export default function Move(props: Props) {
	const { toast } = useToast();

	const onMove = async (pubId: string, sourceStageId: string, destStageId: string) => {
		const err = await move(pubId, sourceStageId, destStageId);
		if (err) {
			toast({
				title: "Error",
				description: err.message,
				variant: "destructive",
			});
			return;
		}
		toast({
			title: "Success",
			description: "Pub was successfully moved",
			variant: "default",
			action: (
				<Button
					onClick={async () =>
						await move(pubId, destStageId, sourceStageId).then(() =>
							toast({
								variant: "default",
								title: "Success",
								description: "Pub was successfully moved back",
							})
						)
					}
				>
					Undo
				</Button>
			),
		});
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button size="sm" variant="outline" className="ml-1">
					Move
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<div className="flex flex-col">
					{props.moveTo && (
						<>
							<div className="font-bold text-center mb-4">Move this Pub to:</div>
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
							<div className="font-bold text-center mb-4">Move this Pub back to:</div>
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
