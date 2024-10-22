"use server";

import { captureException } from "@sentry/nextjs";

import type { Action, ActionInstancesId, CommunitiesId, RulesId, StagesId } from "db/public";
import { Event, stagesIdSchema } from "db/public";
import { logger } from "logger";

import type { CreateRuleSchema } from "./components/panel/StagePanelRuleCreator";
import { unscheduleAction } from "~/actions/_lib/scheduleActionInstance";
import { humanReadableEvent } from "~/actions/api";
import { db } from "~/kysely/database";
import {
	createActionInstance,
	getActionInstance,
	removeActionInstance,
	updateActionInstance,
} from "~/lib/server/actions";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { revalidateTagsForCommunity } from "~/lib/server/cache/revalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { createRule, removeRule } from "~/lib/server/rules";
import {
	createMoveConstraint as createMoveConstraintDb,
	createStage as createStageDb,
	getPubIdsInStage,
	removeStages,
	updateStage,
} from "~/lib/server/stages";

async function deleteMoveConstraints(moveConstraintIds: [StagesId, StagesId][]) {
	await autoRevalidate(
		db
			.deleteFrom("move_constraint")
			.where(
				"move_constraint.stageId",
				"in",
				moveConstraintIds.map(([stageId]) => stageId as StagesId)
			)
			.where(
				"move_constraint.destinationId",
				"in",
				moveConstraintIds.map(([, destinationId]) => destinationId as StagesId)
			)
			.returningAll()
	).execute();
}

export const createStage = defineServerAction(async function createStage(
	communityId: CommunitiesId,
	id: StagesId
) {
	const validatedId = stagesIdSchema.parse(id);

	// TODO: add authorization check
	try {
		await createStageDb({
			id: validatedId,
			name: "Untitled Stage",
			order: "aa",
			communityId,
		}).executeTakeFirstOrThrow();
	} catch (error) {
		return {
			error: "Failed to create stage",
			cause: error,
		};
	}
});

export const deleteStage = defineServerAction(async function deleteStage(stageId: StagesId) {
	// TODO: add authorization check

	let result: {
		formName: string;
	}[] = [];
	try {
		result = await removeStages([stageId]).execute();
	} catch (error) {
		return {
			error: "Failed to delete stage",
			cause: error,
		};
	} finally {
		revalidateTagsForCommunity(["stages", "PubsInStages"]);
		if (result.length) {
			return result.map(({ formName }) => formName).join(", ");
		}
	}
});

export const createMoveConstraint = defineServerAction(async function createMoveConstraint(
	sourceStageId: StagesId,
	destinationStageId: StagesId
) {
	// TODO: add authorization check
	try {
		await createMoveConstraintDb({
			stageId: sourceStageId,
			destinationId: destinationStageId,
		}).executeTakeFirstOrThrow();
	} catch (error) {
		return {
			error: "Failed to connect stages",
			cause: error,
		};
	} finally {
		revalidateTagsForCommunity(["move_constraint"]);
	}
});

export const deleteStagesAndMoveConstraints = defineServerAction(
	async function deleteStagesAndMoveConstraints(
		stageIds: StagesId[],
		moveConstraintIds: [StagesId, StagesId][]
	) {
		try {
			// Delete move constraints prior to deleting stages to prevent foreign
			// key constraint violations.
			if (moveConstraintIds.length > 0) {
				await deleteMoveConstraints(moveConstraintIds);
			}
			if (stageIds.length > 0) {
				await removeStages(stageIds).executeTakeFirstOrThrow();
			}
		} catch (error) {
			return {
				error: "Failed to delete stages and/or connections",
				cause: error,
			};
		} finally {
			revalidateTagsForCommunity(["move_constraint"]);
		}
	}
);

export const updateStageName = defineServerAction(async function updateStageName(
	stageId: StagesId,
	name: string
) {
	// TODO: add authorization check
	try {
		await updateStage(stageId, {
			name,
		}).executeTakeFirstOrThrow();
	} catch (error) {
		return {
			error: "Failed to update stage name",
			cause: error,
		};
	} finally {
		revalidateTagsForCommunity(["stages"]);
	}
});

export const revalidateStages = defineServerAction(async function revalidateStages() {
	revalidateTagsForCommunity(["stages", "PubsInStages"]);
});

export const addAction = defineServerAction(async function addAction(
	stageId: StagesId,
	actionName: Action
) {
	// TODO: add authorization check
	try {
		await createActionInstance({
			name: actionName,
			action: actionName,
			stageId,
		}).executeTakeFirstOrThrow();
	} catch (error) {
		return {
			error: "Failed to add action",
			cause: error,
		};
	}
});

export const updateAction = defineServerAction(async function updateAction(
	actionInstanceId: ActionInstancesId,
	props:
		| {
				config: Record<string, any>;
				name?: undefined;
		  }
		| { name: string; config?: undefined }
) {
	// TODO: add authorization checks

	const result = await updateActionInstance(actionInstanceId, props).executeTakeFirstOrThrow();

	return {
		success: true,
		report: "Action updated",
	};
});

export const deleteAction = defineServerAction(async function deleteAction(
	actionId: ActionInstancesId
) {
	// TODO: add authorization check
	try {
		await removeActionInstance(actionId).executeTakeFirstOrThrow();
	} catch (error) {
		return {
			error: "Failed to delete action",
			cause: error,
		};
	} finally {
		revalidateTagsForCommunity(["action_instances"]);
	}
});

export const addRule = defineServerAction(async function addRule({
	data,
}: {
	data: CreateRuleSchema;
}) {
	try {
		await createRule({
			actionInstanceId: data.actionInstanceId as ActionInstancesId,
			event: data.event,
			config: "additionalConfiguration" in data ? data.additionalConfiguration : null,
		}).executeTakeFirstOrThrow();
	} catch (error) {
		logger.error(error);
		if (error.message?.includes("unique constraint")) {
			return {
				title: "Rule already exists",
				error: `A rule for '${humanReadableEvent(data.event)}' and this action already exists. Please add another action
						of the same type to this stage in order to have the same action trigger
						multiple times for '${humanReadableEvent(data.event)}'.`,
				cause: error,
			};
		}

		return {
			error: "Failed to add rule",
			cause: error,
		};
	} finally {
	}
});

export const deleteRule = defineServerAction(async function deleteRule(ruleId: RulesId) {
	try {
		const deletedRule = await autoRevalidate(
			removeRule(ruleId).qb.returningAll()
		).executeTakeFirstOrThrow();

		if (!deletedRule) {
			return {
				error: "Failed to delete rule",
				cause: `Rule with id ${ruleId} not found`,
			};
		}

		if (deletedRule.event !== Event.pubInStageForDuration) {
			return;
		}

		const actionInstance = await getActionInstance(
			deletedRule.actionInstanceId
		).executeTakeFirst();

		if (!actionInstance) {
			// something is wrong here
			captureException(
				new Error(
					`Action instance not found for rule ${ruleId} while trying to unschedule jobs`
				)
			);
			return;
		}

		const pubsInStage = await getPubIdsInStage(actionInstance.stageId).executeTakeFirst();
		if (!pubsInStage) {
			// we don't need to unschedule any jobs, as there are no pubs this rule could have been applied to
			return;
		}

		logger.debug(`Unscheduling jobs for rule ${ruleId}`);
		await Promise.all(
			pubsInStage.pubIds.map(async (pubInStageId) =>
				unscheduleAction({
					actionInstanceId: actionInstance.id,
					pubId: pubInStageId,
					stageId: actionInstance.stageId,
				})
			)
		);
	} catch (error) {
		logger.error(error);
		return {
			error: "Failed to delete rule",
			cause: error,
		};
	} finally {
		// 		revalidateTag(`community-stages_${communityId}`);
		// 		revalidateTag(`community-action-runs_${communityId}`);
	}
});
