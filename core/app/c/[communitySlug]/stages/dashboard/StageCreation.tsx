import { useState, FormEvent } from "react";
import StageForm from "./StageForm";
import { StagePayload, StageIndex } from "~/lib/types";
import { stageSources } from "~/lib/stages";

type Props = {
	community: any;
	stageWorkflows: StagePayload[][];
	stageIndex: StageIndex;
};

export default function StageCreation(props: Props) {
	const [loading, setLoading] = useState<boolean>(false);
	const [failure, setFailure] = useState<boolean>(false);
	const [stage, setStage] = useState<any>({
		id: "",
		name: "",
		order: "",
		communityId: "",
		createdAt: new Date(),
		updatedAt: new Date(),
		moveConstraints: [],
	});
	const sources = stageSources(stage, props.stageIndex);

	// async function handleStageCreation(evt: FormEvent<EventTarget>) {
	// 	setLoading(true);
	// 	evt.preventDefault();
	// 	try {
	// 		await fetch(`/api/stage/${props.community.slug}`, {
	// 			method: "POST",
	// 			headers: {
	// 				"Content-Type": "application/json",
	// 			},
	// 			body: JSON.stringify({
	// 				name: "stageName",
	// 				communityId: props.community.id,
	// 				order: "props.order",
	// 			}),
	// 		}).then((res) => {
	// 			console.log(res.json());
	// 			setStage(res.json());
	// 			console.log("it was all gonna be ok");
	// 			// add stage to stageIndex
	// 			// add stage to stageWorkflows

	// 			setLoading(false);
	// 		});
	// 	} catch (error) {
	// 		setFailure(true);
	// 		console.error(error);
	// 	}
	// }

	return (
		<div>
			{/* <StageForm
				stage={stage}
				sources={sources}
				onSubmit={() => console.log("created this")}
			/> */}
			hello new world
		</div>
	);
}
