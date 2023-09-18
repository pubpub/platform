"use client";
import { Button, Popover, PopoverContent, PopoverTrigger, useToast } from "ui";
import { move } from "../lib/actions";
import { PubPayload, StagePayload, StagePayloadMoveConstraintDestination } from "~/lib/types";

type Props = {
	pub: PubPayload;
	stages: StagePayloadMoveConstraintDestination[];
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
					<div className="mb-4">
						<b>Move this pub to:</b>
					</div>
					{props.stages.map((s) => {
						return s.id === props.stage.id ? null : (
							<Button
								variant="ghost"
								key={s.id}
								onClick={() => onMove(props.pub.id, props.stage.id, s.id)}
							>
								{s.name}
							</Button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
