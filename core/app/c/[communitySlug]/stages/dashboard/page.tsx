import prisma from "~/prisma/db";
import StageManagement from "./StageManagement";
import { StageIndex, StagePayload, stageInclude } from "~/lib/types";

function createStageList(stage: StagePayload, stages: StageIndex, visited: Array<StagePayload>) {
	if (visited.includes(stage)) {
		return;
	}
	visited.push(stage);
	for (const constraint of stage.moveConstraints) {
		const nextStage = stages[constraint.destinationId];
		createStageList(nextStage, stages, visited);
	}
}

export default async function Page({ params }: { params: { communitySlug: string } }) {
	const community = await prisma.community.findUnique({
		where: { slug: params.communitySlug },
	});
	if (!community) {
		return null;
	}

	const stages = await prisma.stage.findMany({
		where: { communityId: community.id },
		include: stageInclude,
	});

	// create look up table for stages so you dont iterate in O(n)
	const stageIndex: StageIndex = {};
	for (const stage of stages) {
		stageIndex[stage.id] = stage;
	}
	const stageRoots = stages.filter((stage) => stage.moveConstraintSources.length === 0);
	const stageWorkflows = stageRoots.map((stage) => {
		const visited: Array<StagePayload> = [];
		createStageList(stage, stageIndex, visited);
		return visited;
	});

	return (
		<>
			<h1>Workflow: {params.communitySlug}</h1>
			<StageManagement
				community={community}
				stageWorkflows={stageWorkflows}
				stageIndex={stageIndex}
			/>
		</>
	);
}
