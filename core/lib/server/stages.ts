import { sql } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	CommunitiesId,
	NewMoveConstraint,
	NewStages,
	PubsId,
	StagesId,
	StagesUpdate,
	UsersId,
} from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";

import type { AutoReturnType } from "../types";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";

export const createStage = (props: NewStages) =>
	autoRevalidate(db.insertInto("stages").values(props));

export const updateStage = (stageId: StagesId, props: StagesUpdate) =>
	autoRevalidate(db.updateTable("stages").set(props).where("id", "=", stageId));

export const removeStages = (stageIds: StagesId[]) =>
	autoRevalidate(
		db
			.with("deleted_stages", (db) =>
				db
					.deleteFrom("stages")
					.where("id", "in", stageIds as StagesId[])
					.returning("id")
			)
			.deleteFrom("PubsInStages")
			.where("stageId", "in", (eb) => eb.selectFrom("deleted_stages").select("id"))
	);

export const createMoveConstraint = (props: NewMoveConstraint) =>
	autoRevalidate(db.insertInto("move_constraint").values(props));

/**
 * You should use `executeTakeFirst` here
 */
export const getPubIdsInStage = (stageId: StagesId) =>
	autoCache(
		db
			.selectFrom("PubsInStages")
			.select(sql<PubsId[]>`array_agg("pubId")`.as("pubIds"))
			.where("stageId", "=", stageId)
	);

type CommunityStageProps = { communityId: CommunitiesId; stageId?: StagesId; userId: UsersId };
/**
 * Get all stages the given user has access to
 */
export const getStages = ({ communityId, stageId, userId }: CommunityStageProps) => {
	const stageMemberships = db
		.selectFrom("stage_memberships")
		.innerJoin("membership_capabilities", (join) =>
			join
				.onRef("stage_memberships.role", "=", "membership_capabilities.role")
				.on("membership_capabilities.type", "=", MembershipType.stage)
		)
		.select("stage_memberships.stageId")
		.where("membership_capabilities.capability", "=", Capabilities.viewStage)
		.where("stage_memberships.userId", "=", userId);

	const communityMemberships = db
		.selectFrom("community_memberships")
		.innerJoin("membership_capabilities", (join) =>
			join
				.onRef("membership_capabilities.role", "=", "community_memberships.role")
				.on("membership_capabilities.type", "=", MembershipType.community)
		)
		.innerJoin("stages", "stages.communityId", "community_memberships.communityId")
		.where("community_memberships.userId", "=", userId)
		.where("community_memberships.communityId", "=", communityId)
		.where("membership_capabilities.capability", "=", Capabilities.viewStage)
		.select(["stages.id as stageId"]);

	return autoCache(
		db
			.with("viewableStages", (db) =>
				db
					.selectFrom(
						db
							.selectFrom(
								stageMemberships.union(communityMemberships).as("all_access")
							)
							.select("stageId")
							.as("stageId")
					)
					.distinct()
					.select("stageId")
			)
			.selectFrom("stages")
			.innerJoin("viewableStages", "viewableStages.stageId", "stages.id")
			.where("communityId", "=", communityId)
			.$if(Boolean(stageId), (qb) => qb.where("stages.id", "=", stageId!))
			.select((eb) => [
				jsonArrayFrom(
					eb
						.selectFrom("move_constraint")
						.whereRef("move_constraint.stageId", "=", "stages.id")
						.innerJoin("stages as s", "s.id", "move_constraint.destinationId")
						.select(["s.id", "s.name"])
				).as("moveConstraints"),
				jsonArrayFrom(
					eb
						.selectFrom("move_constraint")
						.whereRef("move_constraint.destinationId", "=", "stages.id")
						.innerJoin("stages as s", "s.id", "move_constraint.stageId")
						.select(["s.id", "s.name"])
				).as("moveConstraintSources"),
				eb
					.selectFrom("PubsInStages")
					.select((eb) =>
						eb.fn
							.count<number>("PubsInStages.pubId")
							.filterWhereRef("PubsInStages.stageId", "=", "stages.id")
							.as("pubsCount")
					)
					.as("pubsCount"),
				// TODO: needs to be fancier and include member groups
				eb
					.selectFrom("stage_memberships")
					.select((eb) =>
						eb.fn
							.count("stage_memberships.userId")
							.filterWhereRef("stage_memberships.stageId", "=", "stages.id")
							.as("memberCount")
					)
					.as("memberCount"),

				eb
					.selectFrom("action_instances")
					.whereRef("action_instances.stageId", "=", "stages.id")
					.select((eb) =>
						eb.fn.count<number>("action_instances.id").as("actionInstancesCount")
					)
					.as("actionInstancesCount"),
			])
			.selectAll("stages")
			.orderBy("order asc")
	);
};

export type CommunityStage = AutoReturnType<typeof getStages>["executeTakeFirstOrThrow"];

export const getIntegrationInstanceBase = (trx = db) =>
	trx
		.selectFrom("integration_instances")
		.selectAll("integration_instances")
		.select((eb) =>
			jsonObjectFrom(
				eb
					.selectFrom("integrations")
					.selectAll("integrations")
					.whereRef("integrations.id", "=", "integration_instances.integrationId")
			)
				.$notNull()
				.as("integration")
		);

export const getIntegrationInstancesForStage = (stageId: StagesId) => {
	return autoCache(getIntegrationInstanceBase().where("stageId", "=", stageId));
};
