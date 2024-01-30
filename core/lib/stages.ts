import { StagePayload, StagesById } from "./types";
import * as z from "zod";

/**
 * takes a stage, a map of
 * stages to their IDs and a list of stages
 * that have been visited so far, sets the head and returns a
 * list of stages that can be reached from the stage provided
 * @param stage
 * @param map of stages
 * @param visited stages
 * @returns
 */
function createStageList(
	stage: StagePayload,
	stages: StagesById,
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

/**
 *
 * @param stages
 * @returns  a map of stages at the index provided in the ID
 */
export const makeStagesById = (stages: StagePayload[]): StagesById => {
	const stagesById: StagesById = {};
	for (const stage of stages) {
		stagesById[stage.id] = stage;
	}
	return stagesById;
};

/**
 * this function takes a list of stages and recursively builds a topological sort of the stages
 * @param stages
 * @returns
 */
export function getStageWorkflows(stages: StagePayload[]): Array<Array<StagePayload>> {
	const stagesById = makeStagesById(stages);
	// find all stages with edges that only point to them
	const stageRoots = stages.filter((stage) => stage.moveConstraintSources.length === 0);
	// for each stage, create a list of stages that can be reached from it
	const stageWorkflows = stageRoots.map((stage) => {
		const visited: Array<StagePayload> = [];
		createStageList(stage, stagesById, visited);
		return visited;
	});
	return stageWorkflows;
}

// this function takes a stage and a map of stages and their IDs and returns a list of stages that can be reached from the stage provided
export function moveConstraintSourcesForStage(stage: StagePayload, stagesById: StagesById) {
	return stage.moveConstraintSources.map((stage) => stagesById[stage.stageId]);
}

export const StageFormSchema = z.object({
	name: z.string(),
	moveConstraints: z.record(z.boolean()),
});

export type StageFormSchema = z.infer<typeof StageFormSchema>;
