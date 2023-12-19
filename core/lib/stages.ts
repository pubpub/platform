import { StagePayload, StageIndex } from "./types";
import * as z from "zod";

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

export function stageList(stages: StagePayload[]) {
	// create look up table for stages so you dont iterate in O(n) during recursion
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
	return { stageIndex, stageWorkflows };
}

export function stageSources(stage: StagePayload, stageIndex: StageIndex) {
	return stage.moveConstraintSources.map((stage) => stageIndex[stage.stageId]);
}

export const stageFormSchema = z.object({
	stageId: z.string().optional(),
	stageName: z.string(),
	stageOrder: z.string(),
	stageMoveConstraints: z.array(
		z.object({
			id: z.string(),
			stageId: z.string(),
			destinationId: z.string(),
			createdAt: z.date(),
			updatedAt: z.date(),
			destination: z.object({
				id: z.string(),
				name: z.string(),
				order: z.string(),
				communityId: z.string(),
				createdAt: z.date(),
				updatedAt: z.date(),
			}),
		})
	),
});
