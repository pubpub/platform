import { sql } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { JsonValue } from "contracts";
import type {
	CommunitiesId,
	NewMoveConstraint,
	NewStages,
	PubsId,
	StagesId,
	StagesUpdate,
} from "db/public";

import type { AutoReturnType } from "../types";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { pubValuesByRef } from "./pub";

// TODO: Finish making this output match the type of getCommunityStages in
// core/app/c/[communitySlug]/stages/page.tsx (add pub children and other missing joins)
export const getCommunityStagesFull = (communityId: CommunitiesId) =>
	autoCache(
		db
			.selectFrom("stages")
			.where("communityId", "=", communityId)
			.select((eb) => [
				jsonArrayFrom(
					eb
						.selectFrom("move_constraint")
						.whereRef("move_constraint.stageId", "=", "stages.id")
						.selectAll("move_constraint")
						.select((eb) => [
							jsonObjectFrom(
								eb
									.selectFrom("stages")
									.whereRef("stages.id", "=", "move_constraint.destinationId")
									.selectAll("stages")
							)
								.$notNull()
								.as("destination"),
						])
				).as("moveConstraints"),
				jsonArrayFrom(
					eb
						.selectFrom("move_constraint")
						.whereRef("move_constraint.destinationId", "=", "stages.id")
						.selectAll("move_constraint")
				).as("moveConstraintSources"),
				jsonArrayFrom(
					eb
						.selectFrom("PubsInStages")
						.select("pubId")
						.whereRef("stageId", "=", "stages.id")
						.select(pubValuesByRef("pubId"))
				).as("pubs"),
				jsonArrayFrom(
					eb
						.selectFrom("permissions")
						.innerJoin("_PermissionToStage", "permissions.id", "_PermissionToStage.A")
						.whereRef("stages.id", "=", "stages.id")
						.selectAll("permissions")
						.select((eb) => [
							jsonObjectFrom(
								eb
									.selectFrom("members")
									.whereRef("members.id", "=", "permissions.memberId")
									.selectAll("members")
									.select((eb) => [
										jsonObjectFrom(
											eb
												.selectFrom("users")
												.select([
													"users.id",
													"users.firstName",
													"users.lastName",
													"users.avatar",
													"users.email",
												])
												.whereRef("members.userId", "=", "users.id")
										)
											.$notNull()
											.as("user"),
									])
							).as("member"),
							jsonObjectFrom(
								eb
									.selectFrom("member_groups")
									.selectAll("member_groups")
									.whereRef("member_groups.id", "=", "permissions.memberGroupId")
									.select((eb) => [
										jsonArrayFrom(
											eb
												.selectFrom("users")
												.innerJoin(
													"_MemberGroupToUser",
													"member_groups.id",
													"_MemberGroupToUser.B"
												)
												.whereRef("users.id", "=", "_MemberGroupToUser.A")
												.select([
													"users.id",
													"users.firstName",
													"users.lastName",
													"users.avatar",
													"users.email",
												])
										).as("users"),
									])
							).as("memberGroup"),
						])
				).as("permissions"),
				jsonArrayFrom(
					eb
						.selectFrom("integration_instances")
						.whereRef("integration_instances.stageId", "=", "stages.id")
						.selectAll()
						.select((eb) => [
							jsonObjectFrom(
								eb
									.selectFrom("integrations")
									.selectAll("integrations")
									.whereRef(
										"integrations.id",
										"=",
										"integration_instances.integrationId"
									)
									.$narrowType<{ actions: JsonValue }>()
							)
								.$notNull()
								.as("integration"),
						])
						.$narrowType<{ config: JsonValue }>()
				).as("integrationInstances"),
				jsonArrayFrom(
					eb
						.selectFrom("action_instances")
						.whereRef("action_instances.stageId", "=", "stages.id")
						.selectAll()
						.$narrowType<{ config: JsonValue }>()
				).as("actionInstances"),
			])
			.selectAll("stages")
			.orderBy("order asc")
	);

export const createStage = (props: NewStages) =>
	autoRevalidate(db.insertInto("stages").values(props));

export const updateStage = (stageId: StagesId, props: StagesUpdate) =>
	autoRevalidate(db.updateTable("stages").set(props).where("id", "=", stageId));

// Returns the name of any forms where the submit button pointed to one of the deleted stages
export const removeStages = (stageIds: StagesId[]) =>
	autoRevalidate(
		db
			.with("deleted_stages", (db) =>
				db
					.deleteFrom("stages")
					.where("id", "in", stageIds as StagesId[])
					.returning("id")
			)
			.with("deleted_pub_connections", (db) =>
				db
					.deleteFrom("PubsInStages")
					.where("stageId", "in", (eb) => eb.selectFrom("deleted_stages").select("id"))
			)
			.selectFrom("deleted_stages")
			.innerJoin("form_elements", "form_elements.stageId", "deleted_stages.id")
			.innerJoin("forms", "forms.id", "form_elements.formId")
			.select("forms.name as formName")
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

export const getCommunityStages = (communityId: CommunitiesId) =>
	autoCache(
		db
			.selectFrom("stages")
			.where("communityId", "=", communityId)
			.select((eb) => [
				jsonArrayFrom(
					eb
						.selectFrom("move_constraint")
						.whereRef("move_constraint.stageId", "=", "stages.id")
						.selectAll("move_constraint")
						.select((eb) => [
							jsonObjectFrom(
								eb
									.selectFrom("stages")
									.whereRef("stages.id", "=", "move_constraint.destinationId")
									.selectAll("stages")
							)
								.$notNull()
								.as("destination"),
						])
				).as("moveConstraints"),
				jsonArrayFrom(
					eb
						.selectFrom("move_constraint")
						.whereRef("move_constraint.destinationId", "=", "stages.id")
						.selectAll("move_constraint")
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
					.selectFrom("permissions")
					.innerJoin("_PermissionToStage", "permissions.id", "_PermissionToStage.A")
					.innerJoin("members", "_PermissionToStage.B", "members.id")
					.select((eb) =>
						eb.fn
							.count("_PermissionToStage.A")
							.filterWhereRef("_PermissionToStage.B", "=", "stages.id")
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

export type CommunityStage = AutoReturnType<typeof getCommunityStages>["executeTakeFirstOrThrow"];

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
