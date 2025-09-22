"use server";

import { captureException } from "@sentry/nextjs";

import type {
	Action,
	ActionInstancesId,
	CommunitiesId,
	FormsId,
	RulesId,
	StagesId,
	UsersId,
} from "db/public";
import { Capabilities, Event, MemberRole, MembershipType, stagesIdSchema } from "db/public";
import { logger } from "logger";

import type { CreateRuleSchema } from "./components/panel/actionsTab/StagePanelRuleCreator";
import { unscheduleAction } from "~/actions/_lib/scheduleActionInstance";
import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { ApiError } from "~/lib/server";
import {
	createActionInstance,
	getActionInstance,
	removeActionInstance,
	updateActionInstance,
} from "~/lib/server/actions";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { revalidateTagsForCommunity } from "~/lib/server/cache/revalidate";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { insertStageMemberships } from "~/lib/server/member";
import { createRuleWithCycleCheck, removeRule, RuleError } from "~/lib/server/rules";
import {
	createMoveConstraint as createMoveConstraintDb,
	createStage as createStageDb,
	getPubIdsInStage,
	removeStages,
	updateStage,
} from "~/lib/server/stages";
import { createUserWithMemberships } from "~/lib/server/user";

async function deleteMoveConstraints(moveConstraintIds: StagesId[]) {
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const community = await findCommunityBySlug();

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}

	const authorized = await userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		loginData.user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	await autoRevalidate(
		db
			.deleteFrom("move_constraint")
			.where("move_constraint.destinationId", "in", moveConstraintIds)
			.returningAll()
	).execute();
}

export const createStage = defineServerAction(async function createStage(
	communityId: CommunitiesId,
	id: StagesId
) {
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const { user } = loginData;

	const authorized = await userCan(
		Capabilities.createStage,
		{ type: MembershipType.community, communityId },
		user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	const validatedId = stagesIdSchema.parse(id);

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
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const { user } = loginData;

	const authorized = await userCan(
		Capabilities.deleteStage,
		{ type: MembershipType.stage, stageId },
		user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	try {
		await removeStages([stageId]).executeTakeFirstOrThrow();
	} catch (error) {
		return {
			error: "Failed to delete stage",
			cause: error,
		};
	} finally {
		await revalidateTagsForCommunity(["stages", "PubsInStages"]);
	}
});

export const createMoveConstraint = defineServerAction(async function createMoveConstraint(
	sourceStageId: StagesId,
	destinationStageId: StagesId
) {
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const community = await findCommunityBySlug();

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}

	const authorized = await userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		loginData.user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

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
		await revalidateTagsForCommunity(["move_constraint"]);
	}
});

export const deleteStagesAndMoveConstraints = defineServerAction(
	async function deleteStagesAndMoveConstraints(
		stageIds: StagesId[],
		moveConstraintIds: StagesId[]
	) {
		const loginData = await getLoginData();
		if (!loginData || !loginData.user) {
			return ApiError.NOT_LOGGED_IN;
		}
		const community = await findCommunityBySlug();

		if (!community) {
			return ApiError.COMMUNITY_NOT_FOUND;
		}

		const authorized = await userCan(
			Capabilities.editCommunity,
			{ type: MembershipType.community, communityId: community.id },
			loginData.user.id
		);

		if (!authorized) {
			return ApiError.UNAUTHORIZED;
		}

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
			await revalidateTagsForCommunity(["move_constraint"]);
		}
	}
);

export const updateStageName = defineServerAction(async function updateStageName(
	stageId: StagesId,
	name: string
) {
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const { user } = loginData;

	const authorized = await userCan(
		Capabilities.manageStage,
		{ type: MembershipType.stage, stageId },
		user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}
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
		await revalidateTagsForCommunity(["stages"]);
	}
});

export const revalidateStages = defineServerAction(async function revalidateStages() {
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	await revalidateTagsForCommunity(["stages", "PubsInStages"]);
});

export const addAction = defineServerAction(async function addAction(
	stageId: StagesId,
	actionName: Action
) {
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const { user } = loginData;

	const authorized = await userCan(
		Capabilities.manageStage,
		{ type: MembershipType.stage, stageId },
		user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}
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
	stageId: StagesId,
	props:
		| {
				config: Record<string, any>;
				name?: undefined;
		  }
		| { name: string; config?: undefined }
) {
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const authorized = await userCan(
		Capabilities.manageStage,
		{ type: MembershipType.stage, stageId },
		loginData.user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	const result = await updateActionInstance(actionInstanceId, props).executeTakeFirstOrThrow();

	return {
		success: true,
		report: "Action updated",
	};
});

export const deleteAction = defineServerAction(async function deleteAction(
	actionId: ActionInstancesId,
	stageId: StagesId
) {
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const authorized = await userCan(
		Capabilities.manageStage,
		{ type: MembershipType.stage, stageId },
		loginData.user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	try {
		await removeActionInstance(actionId).executeTakeFirstOrThrow();
	} catch (error) {
		return {
			error: "Failed to delete action",
			cause: error,
		};
	} finally {
		await revalidateTagsForCommunity(["action_instances"]);
	}
});

export const addRule = defineServerAction(async function addRule({
	stageId,
	data,
}: {
	stageId: StagesId;
	data: CreateRuleSchema;
}) {
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const authorized = await userCan(
		Capabilities.manageStage,
		{ type: MembershipType.stage, stageId },
		loginData.user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	try {
		await createRuleWithCycleCheck({
			actionInstanceId: data.actionInstanceId as ActionInstancesId,
			event: data.event,
			config: "additionalConfiguration" in data ? data.additionalConfiguration : null,
			sourceActionInstanceId:
				"sourceActionInstanceId" in data ? data.sourceActionInstanceId : undefined,
		});
	} catch (error) {
		logger.error(error);
		if (error instanceof RuleError) {
			return {
				title: "Error creating rule",
				error: error.message,
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
	stageId: StagesId
) {
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const authorized = await userCan(
		Capabilities.manageStage,
		{ type: MembershipType.stage, stageId },
		loginData.user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

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

export const removeStageMember = defineServerAction(async function removeStageMember(
	userId: UsersId,
	stageId: StagesId
) {
	const { user } = await getLoginData();
	if (!user) {
		return ApiError.NOT_LOGGED_IN;
	}
	if (
		!(await userCan(
			Capabilities.removeStageMember,
			{ type: MembershipType.stage, stageId },
			user.id
		))
	) {
		return {
			title: "Unauthorized",
			error: "You are not authorized to remove a stage member",
		};
	}
	await autoRevalidate(
		db
			.deleteFrom("stage_memberships")
			.where("stage_memberships.stageId", "=", stageId)
			.where("stage_memberships.userId", "=", userId)
	).execute();
});

export const addStageMember = defineServerAction(async function addStageMember(
	stageId: StagesId,
	{
		userId,
		role,
		forms,
	}: {
		userId: UsersId;
		role: MemberRole;
		forms: FormsId[];
	}
) {
	try {
		const { user } = await getLoginData();
		if (!user) {
			return ApiError.NOT_LOGGED_IN;
		}
		if (
			!(await userCan(
				Capabilities.addStageMember,
				{ type: MembershipType.stage, stageId },
				user.id
			))
		) {
			return {
				title: "Unauthorized",
				error: "You are not authorized to add a stage member",
			};
		}

		await insertStageMemberships({ userId, stageId, role, forms }).execute();
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			return {
				title: "Failed to add member",
				error: "User is already a member of this stage",
			};
		}
	}
});

export const addUserWithStageMembership = defineServerAction(
	async function addUserWithStageMembership(
		stageId: StagesId,
		data: {
			firstName: string;
			lastName?: string | null;
			email: string;
			role: MemberRole;
			isSuperAdmin?: boolean;
			forms: FormsId[];
		}
	) {
		await createUserWithMemberships({
			...data,
			membership: {
				stageId,
				role: data.role,
				type: MembershipType.stage,
				forms: data.forms,
			},
		});
	}
);

export const setStageMemberRole = defineServerAction(async function setStageMemberRole(
	stageId: StagesId,
	role: MemberRole,
	userId: UsersId
) {
	const { user } = await getLoginData();
	if (!user) {
		return ApiError.NOT_LOGGED_IN;
	}
	if (
		!(await userCan(
			Capabilities.removeStageMember,
			{ type: MembershipType.stage, stageId },
			user.id
		))
	) {
		return {
			title: "Unauthorized",
			error: "You are not authorized to set a stage member's role",
		};
	}
	await autoRevalidate(
		db
			.updateTable("stage_memberships")
			.where("stageId", "=", stageId)
			.where("userId", "=", userId)
			.set({ role })
	).execute();
});
