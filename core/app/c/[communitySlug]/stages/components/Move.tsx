"use client";
import { Button, Popover, PopoverContent, PopoverTrigger, useToast } from "ui";
import {
	PubPayload,
	StagePayload,
	StagePayloadMoveConstraintDestination,
	StagePayloadMoveConstraintDestinationFrom,
} from "~/lib/types";
import { move } from "./lib/actions";

type Props = {
	pub: PubPayload;
	stages?: StagePayloadMoveConstraintDestination[];
	stagesToMoveBackFrom?: StagePayloadMoveConstraintDestinationFrom[];
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

	function renderMoveButtonText() {
		if (props.stages) {
			return "Move";
		} else {
			return "Move back";
		}
	}

	function renderMoveText() {
		if (props.stages) {
			return "Move this pub to:";
		} else {
			return "Move this pub back to:";
		}
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button size="sm" variant="outline" className="ml-1">
					{renderMoveButtonText()}
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<div className="flex flex-col">
					<div className="mb-4">{renderMoveText()}</div>
					{props.stages &&
						props.stages.map((stage) => {
							return stage.id === props.stage.id ? null : (
								<Button
									variant="ghost"
									key={stage.id}
									onClick={() => onMove(props.pub.id, props.stage.id, stage.id)}
								>
									{stage.name}
								</Button>
							);
						})}
					{props.stagesToMoveBackFrom &&
						props.stagesToMoveBackFrom.map((stage) => {
							return stage.id === props.stage.id ? null : (
								<Button
									variant="ghost"
									key={stage.id}
									onClick={() => onMove(props.pub.id, props.stage.id, stage.id)}
								>
									{stage.name}
								</Button>
							);
						})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
