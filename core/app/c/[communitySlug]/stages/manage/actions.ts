"use server";

import { revalidateTag } from "next/cache";
import { captureException } from "@sentry/nextjs";

import type { Action as PrismaAction } from "db/prisma/client";
import type Action from "db/public/Action";
import type { CommunitiesId } from "db/public/Communities";
import type { RulesId } from "db/public/Rules";
import { type ActionInstancesId } from "db/public/ActionInstances";
import Event from "db/public/Event";
import { logger } from "logger";

import type { CreateRuleSchema } from "./components/panel/StagePanelRuleCreator";
import { unscheduleAction } from "~/actions/_lib/scheduleActionInstance";
import { humanReadableEvent } from "~/actions/api";
import { db } from "~/kysely/database";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { revalidateTagsForCommunity } from "~/lib/server/cache/revalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";
import prisma from "~/prisma/db";

async function deleteStages(stageIds: string[]) {
	await prisma.stage.deleteMany({
		where: {
			id: {
				in: stageIds,
			},
		},
	});
}

async function deleteMoveConstraints(moveConstraintIds: [string, string][]) {
	const ops = moveConstraintIds.map(([stageId, destinationId]) =>
		prisma.moveConstraint.delete({
			where: {
				moveConstraintId: {
					stageId,
					destinationId,
				},
			},
		})
	);
	await Promise.all(ops);
}

export const createStage = defineServerAction(async function createStage(communityId: string) {
	try {
		await prisma.stage.create({
			data: {
				name: "Untitled Stage",
				order: "aa",
				community: {
					connect: {
						id: communityId,
					},
				},
			},
		});
	} catch (error) {
		return {
			error: "Failed to create stage",
			cause: error,
		};
	} finally {
		revalidateTagsForCommunity(["stages", "PubsInStages"]);
	}
});

export const deleteStage = defineServerAction(async function deleteStage(
	communityId: string,
	stageId: string
) {
	try {
		await prisma.stage.delete({
			where: {
				id: stageId,
			},
		});
	} catch (error) {
		return {
			error: "Failed to delete stage",
			cause: error,
		};
	} finally {
		revalidateTagsForCommunity(["stages", "PubsInStages"]);
	}
});

export const createMoveConstraint = defineServerAction(async function createMoveConstraint(
	communityId: string,
	sourceStageId: string,
	destinationStageId: string
) {
	try {
		await prisma.moveConstraint.create({
			data: {
				stage: {
					connect: {
						id: sourceStageId,
					},
				},
				destination: {
					connect: {
						id: destinationStageId,
					},
				},
			},
		});
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
		communityId: string,
		stageIds: string[],
		moveConstraintIds: [string, string][]
	) {
		try {
			// Delete move constraints prior to deleting stages to prevent foreign
			// key constraint violations.
			if (moveConstraintIds.length > 0) {
				await deleteMoveConstraints(moveConstraintIds);
			}
			if (stageIds.length > 0) {
				await deleteStages(stageIds);
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
	communityId: string,
	stageId: string,
	name: string
) {
	try {
		await prisma.stage.update({
			where: {
				id: stageId,
			},
			data: {
				name,
			},
		});
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
	communityId: string,
	stageId: string,
	actionName: Action
) {
	try {
		await prisma.actionInstance.create({
			data: {
				name: actionName,
				action: actionName as PrismaAction,
				stage: {
					connect: {
						id: stageId,
					},
				},
			},
		});
	} catch (error) {
		return {
			error: "Failed to add action",
			cause: error,
		};
	} finally {
		revalidateTagsForCommunity(["stages", "PubsInStages", "action_instances"]);
	}
});

export const updateAction = defineServerAction(async function updateAction(
	communityId: string,
	actionInstanceId: ActionInstancesId,
	props:
		| {
				config: Record<string, any>;
				name?: undefined;
		  }
		| { name: string; config?: undefined }
) {
	const result = await autoRevalidate(
		db
			.updateTable("action_instances")
			.set(props.name ? { name: props.name } : { config: props.config })
			.where("id", "=", actionInstanceId)
	).executeTakeFirstOrThrow();

	return {
		success: true,
		report: "Action updated",
	};
});

export const deleteAction = defineServerAction(async function deleteAction(
	communityId: string,
	actionId: string
) {
	try {
		await prisma.actionInstance.delete({
			where: {
				id: actionId,
			},
		});
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
	communityId,
}: {
	data: CreateRuleSchema;
	communityId: CommunitiesId;
}) {
	try {
		await autoRevalidate(
			db.insertInto("rules").values({
				actionInstanceId: data.actionInstanceId as ActionInstancesId,
				event: data.event,
				config: "additionalConfiguration" in data ? data.additionalConfiguration : null,
			})
		).executeTakeFirstOrThrow();
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

export const deleteRule = defineServerAction(async function deleteRule(
	ruleId: RulesId,
	communityId: string
) {
	try {
		const deletedRule = await autoRevalidate(
			db.deleteFrom("rules").where("id", "=", ruleId).returningAll()
		).executeTakeFirst();

		if (!deletedRule) {
			return {
				error: "Failed to delete rule",
				cause: `Rule with id ${ruleId} not found`,
			};
		}

		if (deletedRule.event !== Event.pubInStageForDuration) {
			return;
		}

		const actionInstance = await db
			.selectFrom("action_instances")
			.select(["id", "action", "stageId"])
			.where("id", "=", deletedRule.actionInstanceId)
			.executeTakeFirst();

		if (!actionInstance) {
			// something is wrong here
			captureException(
				new Error(
					`Action instance not found for rule ${ruleId} while trying to unschedule jobs`
				)
			);
			return;
		}

		const pubsInStage = await db
			.selectFrom("PubsInStages")
			.select(["pubId", "stageId"])
			.where("stageId", "=", actionInstance.stageId)
			.execute();

		if (!pubsInStage) {
			// we don't need to unschedule any jobs, as there are no pubs this rule could have been applied to
			return;
		}

		logger.debug(`Unscheduling jobs for rule ${ruleId}`);
		await Promise.all(
			pubsInStage.map(async (pubInStage) =>
				unscheduleAction({
					actionInstanceId: actionInstance.id,
					pubId: pubInStage.pubId,
					stageId: pubInStage.stageId,
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
