import { cache } from "react";
import { QueryCreator, sql } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";

import type {
	CommunitiesId,
	NewMoveConstraint,
	NewStages,
	PublicSchema,
	PubsId,
	StagesId,
	StagesUpdate,
	UsersId,
} from "db/public";
import { Capabilities, MembershipType } from "db/public";

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

/** To conveniently get a CTE of view stage capabilities. Join this to your query on stageId, i.e.
 *
 * db
 *	.with("viewableStages", (db) => viewableStagesCte({ db: db, userId, communityId }))
 *	.selectFrom("stages")
 *	.innerJoin("viewableStages", "viewableStages.stageId", "stages.id")
 */
export const viewableStagesCte = ({
	db,
	userId,
	communityId,
}: {
	db: QueryCreator<PublicSchema>;
	userId: UsersId;
	communityId?: CommunitiesId;
}) => {
	const stageMemberships = db
		.selectFrom("stage_memberships")
		.innerJoin("membership_capabilities", (join) =>
			join
				.onRef("stage_memberships.role", "=", "membership_capabilities.role")
				.on("membership_capabilities.type", "=", MembershipType.stage)
		)
		.$if(Boolean(communityId), (qb) =>
			qb
				.innerJoin("stages", "stages.id", "stage_memberships.stageId")
				.where("stages.communityId", "=", communityId!)
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
		.$if(Boolean(communityId), (qb) =>
			qb.where("community_memberships.communityId", "=", communityId!)
		)
		.where("membership_capabilities.capability", "=", Capabilities.viewStage)
		.select(["stages.id as stageId"]);

	return db
		.selectFrom(
			db
				.selectFrom(stageMemberships.union(communityMemberships).as("all_access"))
				.select("stageId")
				.as("stageId")
		)
		.distinct()
		.select("stageId");
};

export const getStagesViewableByUser = cache(
	async (
		userId: UsersId,
		communityId: CommunitiesId,
		/* manually supply this when calling outside a community context */
		communitySlug?: string
	) => {
		return autoCache(
			viewableStagesCte({ db, userId, communityId })
				.clearSelect()
				.select((eb) => eb.fn.countAll<number>().as("count")),
			{
				communitySlug,
			}
		)
			.executeTakeFirstOrThrow()
			.then((res) => (res?.count ?? 0) > 0);
	}
);

type CommunityStageProps = { communityId: CommunitiesId; stageId?: StagesId; userId: UsersId };
type CommunityStageOptions = {
	withActionInstances?: "count" | "full" | false;
	withMembers?: "count" | "full" | false;
};

/**
 * Get all stages the given user has access to
 */
export const getStages = (
	{ communityId, stageId, userId }: CommunityStageProps,
	options: CommunityStageOptions = {}
) => {
	const withActionInstances = options.withActionInstances ?? "count";

	return autoCache(
		db
			.with("viewableStages", (db) => viewableStagesCte({ db: db, userId, communityId }))
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
			])
			.$if(withActionInstances === "count", (qb) =>
				qb.select((eb) =>
					eb
						.selectFrom("action_instances")
						.whereRef("action_instances.stageId", "=", "stages.id")
						.select((eb) =>
							eb.fn.count<number>("action_instances.id").as("actionInstancesCount")
						)
						.as("actionInstancesCount")
				)
			)
			.$if(withActionInstances === "full", (qb) =>
				qb.select((eb) =>
					jsonArrayFrom(
						eb
							.selectFrom("action_instances")
							.whereRef("action_instances.stageId", "=", "stages.id")
							.selectAll("action_instances")
					).as("actionInstances")
				)
			)
			.selectAll("stages")
			.orderBy("order asc")
	);
};

export type CommunityStage = AutoReturnType<typeof getStages>["executeTakeFirstOrThrow"];

export const movePub = (pubId: PubsId, stageId: StagesId, trx = db) => {
	return autoRevalidate(
		trx
			.with("leave_stage", (db) => db.deleteFrom("PubsInStages").where("pubId", "=", pubId))
			.insertInto("PubsInStages")
			.values([{ pubId, stageId }])
	);
};
