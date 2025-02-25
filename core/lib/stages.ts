import * as Sentry from "@sentry/nextjs";
import * as z from "zod";

import type { StagesId } from "db/public";

import type { CommunityStage } from "./server/stages";

export type StagesById<T extends CommunityStage = CommunityStage> = {
	[key: StagesId]: T;
};

/**
 *
 * @param stages
 * @returns  a map of stages at the index provided in the ID
 */
export const makeStagesById = <T extends { id: StagesId }>(stages: T[]): { [key: StagesId]: T } => {
	return Object.fromEntries(stages.map((stage) => [stage.id, stage]));
};

/**
 * This function takes a list of stages and returns them in the order of a breadth-first flattening
 * of their graph. When the stages form multiple independent graphs
 * @param stages
 * @returns
 */
export function getOrderedStages<T extends CommunityStage>(stages: T[]): Array<T> {
	const stagesById = makeStagesById(stages);
	// find all stages with edges that only point to them
	// also make sure to filter to only move constraints that there are stages for (permission restrictions may return more move constraint stages than a user can see)
	const { leafRoots, roots } = Object.groupBy(
		stages.filter((stage) => {
			if (stage.moveConstraintSources.length === 0) {
				return true;
			}
			return !stage.moveConstraintSources.every((constraint) => stagesById[constraint.id]);
		}),
		(stage) => (stage.moveConstraints.length === 0 ? "leafRoots" : "roots")
	);

	const orderedStages = new Set<T>();
	const stagesQueue = roots ?? [];
	const startTime = Date.now();
	try {
		// Breadth-first traversal of the graph(s)
		while (stagesQueue.length > 0) {
			if (Date.now() - startTime > 500) {
				throw new Error("Stage sorting timed out");
			}
			const stage = stagesQueue.shift();
			if (!stage) {
				// This should be unreachable because of the condition in the while, but Typescript
				// doesn't know that
				break;
			}

			// If we've already visited this stage we're in a cycle, and shouldn't add its destinations.
			// But we don't break, because there may be other stages already in the queue that should
			// still be visited
			if (orderedStages.has(stage)) {
				continue;
			}
			orderedStages.add(stage);
			stage.moveConstraints.forEach((destinationStage) =>
				stagesQueue.push(stagesById[destinationStage.id])
			);
		}
	} catch (err) {
		Sentry.captureException(err);
		// Sorting took too long, but we don't need to throw and can still dedupe the input stages
		return [...new Set(stages)];
	}

	// Append all the stages with no sources or destinations to the very end
	leafRoots?.forEach((stage) => orderedStages.add(stage));

	// Because the algorithm above starts with "root" stages only, it will totally exclude graphs
	// where every stage is part of a cycle (biconnected graphs). Since we don't know where those
	// graphs should begin, we skip sorting them but make sure their stages are included in the
	// output
	stages.forEach((stage) => orderedStages.add(stage));

	return [...orderedStages];
}

// this function takes a stage and a map of stages and their IDs and returns a list of stages that can be reached from the stage provided
export function moveConstraintSourcesForStage<T extends CommunityStage>(
	stage: T,
	stagesById: StagesById<T>
) {
	return stage.moveConstraintSources.map((stage) => stagesById[stage.id]);
}

export const StageFormSchema = z.object({
	name: z.string(),
	moveConstraints: z.record(z.boolean()),
});

export type StageFormSchema = z.infer<typeof StageFormSchema>;
