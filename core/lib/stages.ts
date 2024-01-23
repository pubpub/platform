import { StagePayload, StageAtIndex } from "./types";
import * as z from "zod";

// this function takes a stage and a map of
// stages and their IDs and a list of stages
// that have been visited so far, sets the head and returns a
// list of stages that can be reached from the stage provided
function createStageList(
	stage: StagePayload,
	stages: StageAtIndex,
	visited: Array<StagePayload>
): void {
	if (visited.includes(stage)) {
		return;
	}
	visited.push(stage);
	for (const constraint of stage.moveConstraints) {
		const nextStage = stages[constraint.destinationId];
		createStageList(nextStage, stages, visited);
	}
}

// this function takes a list of stages and returns a map of
// stages and their IDs and a 2d array of stages ordered by move constraints (topologically sorted)
export function topologicallySortedStages(stages: StagePayload[]): {
	stageAtIndex: StageAtIndex;
	stageWorkflows: Array<Array<StagePayload>>;
} {
	// creates a map of stages at the index provided in the ID
	const stageAtIndex: StageAtIndex = {};
	for (const stage of stages) {
		stageAtIndex[stage.id] = stage;
	}

	// find all stages with edges that only point to them
	const stageRoots = stages.filter((stage) => stage.moveConstraintSources.length === 0);
	// for each stage, create a list of stages that can be reached from it
	const stageWorkflows = stageRoots.map((stage) => {
		const visited: Array<StagePayload> = [];
		createStageList(stage, stageAtIndex, visited);
		return visited;
	});
	return { stageAtIndex: stageAtIndex, stageWorkflows };
}

// this function takes a stage and a map of stages and their IDs and returns a list of stages that can be reached from the stage provided
export function moveConstraintSourcesForStage(stage: StagePayload, stageAtIndex: StageAtIndex) {
	return stage.moveConstraintSources.map((stage) => stageAtIndex[stage.stageId]);
}

export const StageFormSchema = z.object({
	name: z.string(),
	moveConstraints: z.record(z.boolean()),
});

export type StageFormSchema = z.infer<typeof StageFormSchema>;
