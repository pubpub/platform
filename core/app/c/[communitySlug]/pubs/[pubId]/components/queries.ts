import { Expression, sql } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import { CoreSchemaType, PubsId, PubTypesId } from "db/public";

import { db } from "~/kysely/database";
import { getPubTypeBase, pubValuesByRef } from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";

const stages = (stageId: Expression<string | null>) =>
	jsonArrayFrom(db.selectFrom("stages").whereRef("stages.id", "=", stageId).selectAll());

const actionInstances = (stageId: Expression<string | null>) =>
	jsonArrayFrom(
		db
			.selectFrom("action_instances")
			.whereRef("action_instances.stageId", "=", stageId)
			.selectAll()
	);

const memberFields = (pubId: Expression<string>) =>
	jsonArrayFrom(
		db
			.selectFrom("pub_values")
			.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
			.innerJoin(
				"members",
				"members.id",
				sql`pub_values.value #>> '{}'` as unknown as "members.id"
			)
			.select((eb) => [
				"members.id",
				"members.userId",
				"pub_fields.id as fieldId",
				jsonObjectFrom(
					eb
						.selectFrom("users")
						.select([
							"users.firstName",
							"users.lastName",
							"users.avatar",
							"users.email",
						])
						.whereRef("users.id", "=", "members.userId")
				)
					.$notNull()
					.as("user"),
			])
			.whereRef("pub_values.pubId", "=", pubId)
			.where("pub_fields.schemaName", "=", CoreSchemaType.MemberId)
			.distinctOn("pub_fields.id")
			.orderBy(["pub_fields.id", "pub_values.createdAt desc"])
	);

const pubType = (pubTypeId: Expression<string>) =>
	jsonObjectFrom(getPubTypeBase.whereRef("pub_types.id", "=", pubTypeId));

export const getPubChildrenTable = (parentId: PubsId, selectedPubTypeId?: PubTypesId) => {
	return autoCache(
		db
			.with("all_children", (eb) =>
				eb
					.selectFrom("pubs")
					.where("parentId", "=", parentId)
					.select((eb) => ["id", "pubTypeId", "createdAt"])
					.orderBy("createdAt", "desc")
			)
			.with("children_with_specific_pubtype", (eb) =>
				eb
					.selectFrom("all_children")
					.$if(Boolean(selectedPubTypeId), (eb) =>
						eb.where("pubTypeId", "=", selectedPubTypeId!)
					)
					// if no pubtype is selected, we find pubs by the first pub type created
					.$if(!Boolean(selectedPubTypeId), (eb) =>
						eb.where("pubTypeId", "=", (eb) =>
							eb
								.selectFrom("all_children")
								.innerJoin("pub_types", "pub_types.id", "all_children.pubTypeId")
								.select("pub_types.id")
								.limit(1)
						)
					)
					.innerJoin("PubsInStages", "PubsInStages.pubId", "all_children.id")
					.selectAll()
					.select((eb) => [
						pubValuesByRef("all_children.id" as "pubs.id"),
						memberFields(eb.ref("all_children.id")).as("memberFields"),
						actionInstances(eb.ref("PubsInStages.stageId")).as("actionInstances"),
						stages(eb.ref("PubsInStages.stageId")).as("stages"),
					])
			)
			.with("counts_of_other_pub_types", (eb) =>
				eb
					.selectFrom("all_children")
					.select((eb) => [
						"all_children.pubTypeId",
						eb.fn.count("all_children.pubTypeId").as("count"),
					])
					.groupBy("all_children.pubTypeId")
			)
			.selectFrom("all_children")
			.select((eb) => [
				pubType(
					eb.selectFrom("children_with_specific_pubtype").select("pubTypeId").limit(1)
				).as("active_pubtype"),
				jsonArrayFrom(
					eb
						.selectFrom("children_with_specific_pubtype")
						.selectAll()
						.select(pubValuesByRef("children_with_specific_pubtype.id"))
				).as("children_of_active_pubtype"),
				jsonArrayFrom(
					eb
						.selectFrom("counts_of_other_pub_types")
						.innerJoin(
							"pub_types",
							"pub_types.id",
							"counts_of_other_pub_types.pubTypeId"
						)
						.select(["count", "pubTypeId", "pub_types.name"])
				).as("counts_of_all_pub_types"),
			])
			.limit(1)
	);
};
