import type { OnConflictBuilder } from "kysely";

import { jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	CommunitiesId,
	CommunityMembershipsId,
	FormsId,
	NewCommunityMemberships,
	NewPubMemberships,
	NewStageMemberships,
	UsersId,
} from "db/public";
import { MemberRole } from "db/public";

import type { XOR } from "../types";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { SAFE_USER_SELECT } from "./user";

/**
 * Either get a membership by its community membership id, or all memberships by userId and communityId
 * TODO: this should probably return a user with the community memberships attached
 */
export const selectCommunityMemberships = (
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

export const selectAllCommunityMemberships = (
	{ communityId }: { communityId: CommunitiesId },
	trx = db
) =>
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
				"community_memberships.formId",
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

const getMembershipRows = <T extends { role: MemberRole; forms: FormsId[]; userId: UsersId }>({
	forms,
	...membership
}: T) => {
	return forms.length ? forms.map((formId) => ({ ...membership, formId })) : [{ ...membership }];
};

export const insertCommunityMemberships = (
	membership: Omit<NewCommunityMemberships, "formId"> & { userId: UsersId; forms: FormsId[] },
	trx = db
) =>
	autoRevalidate(
		trx.insertInto("community_memberships").values(getMembershipRows(membership)).returningAll()
	);

export const deleteCommunityMemberships = (
	{ userId, communityId }: { userId: UsersId; communityId: CommunitiesId },
	trx = db
) =>
	autoRevalidate(
		trx
			.deleteFrom("community_memberships")
			.using("users")
			.whereRef("users.id", "=", "community_memberships.userId")
			.where("users.id", "=", userId)
			.where("community_memberships.communityId", "=", communityId)
			.returningAll()
	);

export const deleteCommunityMember = (props: CommunityMembershipsId, trx = db) =>
	autoRevalidate(trx.deleteFrom("community_memberships").where("id", "=", props).returningAll());

export const onConflictOverrideRole = (
	oc: OnConflictBuilder<any, any>,
	columns: ["userId", "communityId"] | ["userId", "pubId"] | ["userId", "stageId"],
	table: "community_memberships" | "pub_memberships" | "stage_memberships"
) =>
	oc.columns(columns).doUpdateSet((eb) => ({
		role: eb
			.case()
			.when(eb.ref(`${table}.role`), "=", MemberRole.admin)
			.then(eb.ref(`${table}.role`))
			.when(
				eb.and([
					eb(eb.ref(`${table}.role`), "=", MemberRole.editor),
					eb(eb.ref("excluded.role"), "!=", MemberRole.admin),
				])
			)
			.then(eb.ref(`${table}.role`))
			.else(eb.ref("excluded.role"))
			.end(),
	}));

export const insertCommunityMembershipsOverrideRole = (
	props: NewCommunityMemberships & { userId: UsersId; forms: FormsId[] },
	trx = db
) =>
	autoRevalidate(
		insertCommunityMemberships(props, trx).qb.onConflict((oc) =>
			onConflictOverrideRole(oc, ["userId", "communityId"], "community_memberships")
		)
	);

export const insertStageMemberships = (
	membership: NewStageMemberships & { userId: UsersId; forms: FormsId[] },
	trx = db
) => autoRevalidate(trx.insertInto("stage_memberships").values(getMembershipRows(membership)));

export const insertStageMembershipsOverrideRole = (
	props: NewStageMemberships & { userId: UsersId; forms: FormsId[] },
	trx = db
) =>
	autoRevalidate(
		insertStageMemberships(props, trx).qb.onConflict((oc) =>
			onConflictOverrideRole(oc, ["userId", "stageId"], "stage_memberships")
		)
	);

export const insertPubMembershipsOverrideRole = (
	props: NewPubMemberships & { userId: UsersId; forms: FormsId[] },
	trx = db
) =>
	autoRevalidate(
		insertPubMemberships(props, trx).qb.onConflict((oc) =>
			onConflictOverrideRole(oc, ["userId", "pubId"], "pub_memberships")
		)
	);

export const insertPubMemberships = (
	membership: NewPubMemberships & { userId: UsersId; forms: FormsId[] },
	trx = db
) => autoRevalidate(trx.insertInto("pub_memberships").values(getMembershipRows(membership)));
