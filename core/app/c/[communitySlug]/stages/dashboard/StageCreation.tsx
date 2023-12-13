import { or } from "ajv/dist/compile/codegen";
import { useState } from "react";

type Props = {
	community: any;
	stageName: string;
	order: string;
};

export default function StageCreation(props: Props) {
	const [loading, setLoading] = useState<boolean>(false);
	const [failure, setFailure] = useState<boolean>(false);

	async function handleStageCreation(form) {
		setLoading(true);
		setFailure(false);
		// create stage
		try {
			const stage = await fetch(`/api/stage/${props.community.slug}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: props.stageName,
					communityId: props.community.id,
					order: props.order,
				}),
			}).then((res) => res.json());
			// add stage to stageIndex
			// add stage to stageWorkflows
		} catch (error) {
			console.error(error);
		}

		setLoading(false);
	}

	return (
		<div>
			<form onSubmit={handleStageCreation}>
				<input type="text" placeholder="Stage Name" />
				<button type="submit">Create Stage</button>
			</form>
		</div>
	);
}
