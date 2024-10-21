import { jsonObjectFrom } from "kysely/helpers/postgres";

import type { CommunitiesId, MembersId, MembersUpdate, NewMembers, UsersId } from "db/public";
import type { CommunityMembershipsId } from "db/src/public/CommunityMemberships";
import { MemberRole } from "db/public";

import type { XOR } from "../types";
import type { userId } from "~/actions/corePubFields";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { SAFE_USER_SELECT } from "./user";

/**
 * Either get a member by their id, or by userId and communityId
 */
export const getMember = (
	props: XOR<{ id: MembersId }, { userId: UsersId; communityId: CommunitiesId }>,
	trx = db
) => {
	return autoCache(
		trx
			.selectFrom("members")
			.select((eb) => [
				"members.id",
				"members.userId",
				"members.createdAt",
				"members.updatedAt",
				"members.role",
				"members.communityId",
				jsonObjectFrom(
					eb
						.selectFrom("users")
						.select(SAFE_USER_SELECT)
						.whereRef("users.id", "=", "members.userId")
				)
					.$notNull()
					.as("user"),
			])
			.$if(Boolean(props.userId), (eb) => eb.where("members.userId", "=", props.userId!))
			.$if(Boolean(props.communityId), (eb) =>
				eb.where("members.communityId", "=", props.communityId!)
			)
			.$if(Boolean(props.id), (eb) => eb.where("members.id", "=", props.id!))
	);
};

export const getMembers = ({ communityId }: { communityId: CommunitiesId }, trx = db) =>
	autoCache(
		trx
			.selectFrom("members")
			.select((eb) => [
				"members.id",
				"members.userId",
				"members.createdAt",
				"members.updatedAt",
				"members.role",
				"members.communityId",
				jsonObjectFrom(
					eb
						.selectFrom("users")
						.select(SAFE_USER_SELECT)
						.whereRef("users.id", "=", "members.userId")
				)
					.$notNull()
					.as("user"),
			])
			.where("members.communityId", "=", communityId)
	);

export const inviteMember = (props: NewMembers, trx = db) =>
	autoRevalidate(
		trx
			.with("community_membership", (db) =>
				db
					.insertInto("community_memberships")
					.values({
						userId: props.userId,
						communityId: props.communityId,
						role: props.role ?? MemberRole.editor,
					})
					.returning("community_memberships.id")
			)
			.insertInto("members")
			.values((eb) => ({
				id: eb.selectFrom("community_membership").select("id") as unknown as MembersId,
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
