"use server";

import type {
	Action,
	ActionInstancesId,
	AutomationsId,
	CommunitiesId,
	FormsId,
	StagesId,
	UsersId,
} from "db/public";
import type { MemberRole } from "db/public";
import { Capabilities, MembershipType, stagesIdSchema } from "db/public";
import { logger } from "logger";

import type { CreateAutomationsSchema } from "./components/panel/actionsTab/StagePanelAutomationForm";
import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { ApiError } from "~/lib/server";
import {
	createActionInstance,
	removeActionInstance,
	updateActionInstance,
} from "~/lib/server/actions";
import {
	AutomationError,
	duplicateAutomation as duplicateAutomationDb,
	removeAutomation,
	upsertAutomationWithCycleCheck,
} from "~/lib/server/automations";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { revalidateTagsForCommunity } from "~/lib/server/cache/revalidate";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { insertStageMemberships } from "~/lib/server/member";
import {
	createMoveConstraint as createMoveConstraintDb,
	createStage as createStageDb,
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

	await updateActionInstance(actionInstanceId, {
		config: props.config,
		name: props.name,
	}).executeTakeFirstOrThrow();

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

export const addOrUpdateAutomation = defineServerAction(async function addOrUpdateAutomation({
	stageId,
	automationId,
	data,
}: {
	stageId: StagesId;
	automationId?: AutomationsId;
	data: CreateAutomationsSchema;
}) {
	const [loginData, community] = await Promise.all([getLoginData(), findCommunityBySlug()]);
	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}
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
		await upsertAutomationWithCycleCheck({
			id: automationId,
			name: data.name,
			description: data.description ?? null,
			icon: data.icon ?? null,
			communityId: community.id,
			stageId,
			conditionEvaluationTiming: data.conditionEvaluationTiming ?? null,
			triggers: data.triggers.map((trigger) => ({
				event: trigger.event,
				config: trigger.config ?? null,
				sourceAutomationId: trigger.sourceAutomationId ?? null,
			})),
			actionInstances: [
				{
					action: data.action.action,
					config: data.action.config ?? null,
				},
			],
			condition: data.condition,
		});
	} catch (error) {
		logger.error(error);
		if (error instanceof AutomationError) {
			return {
				title: automationId ? "Error updating automation" : "Error creating automation",
				error: error.message,
				cause: error,
			};
		}

		return {
			error: automationId ? "Failed to update automation" : "Failed to create automation",
			cause: error,
		};
	}
});

export const deleteAutomation = defineServerAction(async function deleteAutomation(
	automationId: AutomationsId,
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
		const _deletedAutomation = await autoRevalidate(
			removeAutomation(automationId).qb.returningAll()
		).executeTakeFirstOrThrow();

		return {
			success: true,
			report: "Automation deleted",
		};
	} catch (error) {
		logger.error(error);
		return {
			error: "Failed to delete automation",
			cause: error,
		};
	} finally {
		// 		revalidateTag(`community-stages_${communityId}`);
		// 		revalidateTag(`community-action-runs_${communityId}`);
	}
});

export const duplicateAutomation = defineServerAction(async function duplicateAutomation(
	automationId: AutomationsId,
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
		const _duplicatedAutomation = await duplicateAutomationDb(automationId);
	} catch (error) {
		logger.error(error);
		return {
			error: "Failed to duplicate automation",
			cause: error,
		};
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
