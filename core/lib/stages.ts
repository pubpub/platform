import * as z from "zod"

import type { StagesId } from "db/public"

import type { CommunityStage } from "./server/stages"

export type StagesById<T extends CommunityStage = CommunityStage> = {
	[key: StagesId]: T
}

/**
 * Takes a stage, a map of stages to their IDs, and an optional list of stages
 * that have been visited so far. Returns a list of stages that can be reached
 * from the stage provided without mutating the visited stages.
 * @param stage - The current stage
 * @param stages - A map of stage IDs to stage objects
 * @param visited - (Optional) An array of visited stages, defaults to an empty array
 * @returns A new array of stages that have been visited
 */
function createStageList<T extends CommunityStage>(
	stage: T,
	stages: StagesById,
	visited: Array<T> = []
): Array<T> {
	// If the stage has already been visited, return the current visited list
	if (visited.includes(stage)) {
		return visited
	}

	// Add the current stage to the visited list (non-mutating)
	const newVisited = [...visited, stage]

	// Recursively process the stages reachable from this stage
	return stage.moveConstraints.reduce((acc, constraint) => {
		const nextStage = stages[constraint.id]
		return createStageList<T>(nextStage as T, stages, acc)
	}, newVisited)
}

/**
 *
 * @param stages
 * @returns  a map of stages at the index provided in the ID
 */
export const makeStagesById = <T extends { id: StagesId }>(stages: T[]): { [key: StagesId]: T } => {
	return Object.fromEntries(stages.map((stage) => [stage.id, stage]))
}

/**
 * this function takes a list of stages and recursively builds a topological sort of the stages
 * @param stages
 * @returns
 */
export function getStageWorkflows<T extends CommunityStage>(stages: T[]): Array<Array<T>> {
	const stagesById = makeStagesById(stages)
	// find all stages with edges that only point to them
	const stageRoots = stages.filter((stage) => stage.moveConstraintSources.length === 0)
	// for each stage, create a list of stages that can be reached from it
	const stageWorkflows = stageRoots.map((stage) => {
		return createStageList(stage, stagesById)
	})
	return stageWorkflows as T[][]
}

// this function takes a stage and a map of stages and their IDs and returns a list of stages that can be reached from the stage provided
export function moveConstraintSourcesForStage<T extends CommunityStage>(
	stage: T,
	stagesById: StagesById<T>
) {
	return stage.moveConstraintSources.map((stage) => stagesById[stage.id])
}

export const StageFormSchema = z.object({
	name: z.string(),
	moveConstraints: z.record(z.boolean()),
})

export type StageFormSchema = z.infer<typeof StageFormSchema>
