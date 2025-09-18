"use server";

import type { User } from "lucia";

import type { CommunitiesId, FormsId, PubsId, StagesId, UsersId } from "db/public";
import { Capabilities, MemberRole, MembershipType } from "db/public";

import type { CommunityData } from "~/lib/server/community";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { isCommunityAdmin } from "~/lib/authentication/roles";
import { userCan } from "~/lib/authorization/capabilities";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import {
	deleteCommunityMemberships,
	deletePubMemberships,
	deleteStageMemberships,
	insertCommunityMemberships,
	insertPubMemberships,
	insertStageMemberships,
} from "~/lib/server/member";

async function userCanEditMember(
	community: NonNullable<CommunityData>,
	user: User,
	targetId: CommunitiesId | StagesId | PubsId,
	targetType: MembershipType
) {
	switch (targetType) {
		case MembershipType.community:
			return isCommunityAdmin(user, community);
		case MembershipType.stage:
			return userCan(
				Capabilities.removeStageMember,
				{ type: MembershipType.stage, stageId: targetId as StagesId },
				user.id
			);
		case MembershipType.pub:
			return userCan(
				Capabilities.removePubMember,
				{ type: MembershipType.pub, pubId: targetId as PubsId },
				user.id
			);
		default:
			return {
				error: "Invalid membership type",
			};
	}
}

export const updateMember = defineServerAction(async function updateMember({
	userId,
	role,
	forms,
	targetId,
	targetType,
}: {
	userId: UsersId;
	role: MemberRole;
	forms: FormsId[];
	targetId: CommunitiesId | StagesId | PubsId;
	targetType: MembershipType;
}) {
	try {
		const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()]);

		if (!community) {
			return {
				error: "Community not found",
			};
		}

		if (!user) {
			return {
				error: "You are not logged in",
			};
		}

		const userCanEditMemberResult = await userCanEditMember(
			community,
			user,
			targetId,
			targetType
		);

		if (
			userCanEditMemberResult === false ||
			(typeof userCanEditMemberResult === "object" && userCanEditMemberResult.error)
		) {
			let target: string;
			switch (targetType) {
				case MembershipType.community:
					target = "community";
					break;
				case MembershipType.stage:
					target = "stage";
					break;
				case MembershipType.pub:
					target = "pub";
					break;
				default:
					return {
						title: "Failed to update member",
						error: "Invalid membership type",
					};
			}
			return {
				title: "Failed to update member",
				error: `You do not have permission to edit members in this ${target}`,
			};
		}

		const formsToInsert = role === MemberRole.contributor ? forms : [];

		const result = await db.transaction().execute(async (trx) => {
			switch (targetType) {
				case MembershipType.pub:
					await deletePubMemberships(
						{
							pubId: targetId as PubsId,
							userId,
						},
						trx
					).execute();

					return insertPubMemberships(
						{
							pubId: targetId as PubsId,
							userId,
							role,
							forms: formsToInsert,
						},
						trx
					).execute();
				case MembershipType.stage:
					await deleteStageMemberships(
						{
							communityId: community.id,
							userId,
						},
						trx
					).execute();

					return insertStageMemberships(
						{
							stageId: targetId as StagesId,
							userId,
							role,
							forms: formsToInsert,
						},
						trx
					).execute();
				case MembershipType.community:
					await deleteCommunityMemberships(
						{
							communityId: community.id,
							userId,
						},
						trx
					).execute();

					return insertCommunityMemberships(
						{
							communityId: community.id,
							userId,
							role,
							forms: formsToInsert,
						},
						trx
					).execute();
				default:
					return {
						title: "Failed to update member",
						error: "An unexpected error occurred",
					};
			}
		});

		if (!result) {
			return {
				title: "Failed to update member",
				error: "An unexpected error occurred",
			};
		}

		return { success: true };
	} catch (error) {
		return {
			title: "Failed to update member",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
});
