import { jsonObjectFrom } from "kysely/helpers/postgres";

import type { CommunitiesId, MembersId, MembersUpdate, NewMembers, UsersId } from "db/public";

import type { XOR } from "../types";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { SAFE_USER_SELECT } from "./user";

/**
 * Either get a member by their id, or by userId and communityId
 */
export const getMember = (
	props: XOR<{ id: MembersId }, { userId: UsersId; communityId: CommunitiesId }>
) => {
	return autoCache(
		db
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
						.whereRef("users.id", "=", "members.userId")
						.select(SAFE_USER_SELECT)
						.$if(Boolean(props.userId), (eb) =>
							eb.where("users.id", "=", props.userId!)
						)
				)
					.$notNull()
					.as("user"),
			])
			.$if(Boolean(props.communityId), (eb) =>
				eb.where("members.communityId", "=", props.communityId!)
			)
			.$if(Boolean(props.id), (eb) => eb.where("members.id", "=", props.id!))
	);
};

export const addMember = (props: NewMembers) =>
	autoRevalidate(
		db
			.insertInto("members")
			.values({
				userId: props.userId,
				communityId: props.communityId,
				role: props.role,
			})
			.returningAll()
	);

export const updateMember = (props: MembersUpdate & { id: MembersId }) =>
	autoRevalidate(db.updateTable("members").set(props).where("id", "=", props.id).returningAll());

export const removeMember = (props: MembersId) =>
	autoRevalidate(db.deleteFrom("members").where("id", "=", props).returningAll());
