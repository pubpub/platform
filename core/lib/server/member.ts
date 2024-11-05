import { jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	CommunitiesId,
	CommunityMembershipsId,
	MembersId,
	MembersUpdate,
	NewCommunityMemberships,
	UsersId,
} from "db/public";
import { MemberRole } from "db/public";

import type { XOR } from "../types";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { SAFE_USER_SELECT } from "./user";

/**
 * Either get a member by their id, or by userId and communityId
 */
export const getMember = (
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

export const getMembers = ({ communityId }: { communityId: CommunitiesId }, trx = db) =>
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

export const inviteMember = (props: NewCommunityMemberships & { userId: UsersId }, trx = db) =>
	autoRevalidate(
		trx
			.with("member", (db) =>
				db
					.insertInto("members")
					.values({
						userId: props.userId,
						communityId: props.communityId,
						role: props.role ?? MemberRole.editor,
					})
					.returning("members.id")
			)
			.insertInto("community_memberships")
			.values((eb) => ({
				id: eb.selectFrom("member").select("id") as unknown as CommunityMembershipsId,
				userId: props.userId,
				communityId: props.communityId,
				role: props.role,
			}))
			.returningAll()
	);

export const updateMember = ({ id, ...props }: MembersUpdate & { id: MembersId }, trx = db) =>
	autoRevalidate(
		trx
			.with("community_membership", (db) =>
				db
					.updateTable("community_memberships")
					.set(props)
					.where("id", "=", id as unknown as CommunityMembershipsId)
			)
			.updateTable("members")
			.set(props)
			.where("id", "=", id)
			.returningAll()
	);

export const removeMember = (props: MembersId, trx = db) =>
	autoRevalidate(
		trx
			.with("community_membership", (db) =>
				db
					.deleteFrom("community_memberships")
					.where("id", "=", props as unknown as CommunityMembershipsId)
			)
			.deleteFrom("members")
			.where("id", "=", props)
			.returningAll()
	);
