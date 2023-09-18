import { Button, Popover, PopoverContent, PopoverTrigger, useToast } from "ui";
import { move } from "../lib/actions";

export default function Move({ stage, stages, pub }) {
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
					{stages.map((s) => {
						return s.id === stage.id ? null : (
							<Button
								variant="ghost"
								key={s.name}
								onClick={() => onMove(pub.id, stage.id, s.id)}
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
