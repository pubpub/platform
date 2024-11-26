import { jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	CommunitiesId,
	CommunityMembershipsId,
	NewCommunityMemberships,
	NewPubMemberships,
	NewStageMemberships,
	UsersId,
} from "db/public";

import type { XOR } from "../types";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { SAFE_USER_SELECT } from "./user";

/**
 * Either get a member by their community membership id, or by userId and communityId
 */
export const selectCommunityMember = (
	props: XOR<{ id: CommunityMembershipsId }, { userId: UsersId; communityId: CommunitiesId }>,
	trx = db
) => {
	return autoCache(
		trx
			.selectFrom("community_memberships")
			.select((eb) => [
				"community_memberships.id",
				"community_memberships.userId",
				"community_memberships.createdAt",
				"community_memberships.updatedAt",
				"community_memberships.role",
				"community_memberships.communityId",
				jsonObjectFrom(
					eb
						.selectFrom("users")
						.select(SAFE_USER_SELECT)
						.whereRef("users.id", "=", "community_memberships.userId")
				)
					.$notNull()
					.as("user"),
			])
			.$if(Boolean(props.userId), (eb) =>
				eb.where("community_memberships.userId", "=", props.userId!)
			)
			.$if(Boolean(props.communityId), (eb) =>
				eb.where("community_memberships.communityId", "=", props.communityId!)
			)
			.$if(Boolean(props.id), (eb) => eb.where("community_memberships.id", "=", props.id!))
	);
};

export const selectCommunityMembers = ({ communityId }: { communityId: CommunitiesId }, trx = db) =>
	autoCache(
		trx
			.selectFrom("community_memberships")
			.select((eb) => [
				"community_memberships.id",
				"community_memberships.userId",
				"community_memberships.createdAt",
				"community_memberships.updatedAt",
				"community_memberships.role",
				"community_memberships.communityId",
				jsonObjectFrom(
					eb
						.selectFrom("users")
						.select(SAFE_USER_SELECT)
						.whereRef("users.id", "=", "community_memberships.userId")
				)
					.$notNull()
					.as("user"),
			])
			.where("community_memberships.communityId", "=", communityId)
	);

export const insertCommunityMember = (
	props: NewCommunityMemberships & { userId: UsersId },
	trx = db
) =>
	autoRevalidate(
		trx
			.insertInto("community_memberships")
			.values({
				userId: props.userId,
				communityId: props.communityId,
				role: props.role,
			})
			.returningAll()
	);

export const deleteCommunityMember = (props: CommunityMembershipsId, trx = db) =>
	autoRevalidate(trx.deleteFrom("community_memberships").where("id", "=", props).returningAll());

export const insertStageMember = (
	{
		userId,
		stageId,
		role,
	}: NewStageMemberships & {
		userId: UsersId;
	},
	trx = db
) => autoRevalidate(trx.insertInto("stage_memberships").values({ userId, stageId, role }));

export const insertPubMember = (
	{
		userId,
		pubId,
		role,
	}: NewPubMemberships & {
		userId: UsersId;
	},
	trx = db
) => autoRevalidate(trx.insertInto("pub_memberships").values({ userId, pubId, role }));
