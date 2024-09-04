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

export const getPubChildrenTablePubs = (parentId: PubsId) => {
	return autoCache(
		db
			.selectFrom("pubs")
			.leftJoin("PubsInStages", "pubs.id", "PubsInStages.pubId")
			.select((eb) => [
				"pubs.id",
				"pubs.createdAt",
				pubValuesByRef("pubs.id"),
				pubType(eb.ref("pubs.pubTypeId")).as("pubType"),
				memberFields(eb.ref("pubs.id")).as("memberFields"),
				actionInstances(eb.ref("PubsInStages.stageId")).as("actionInstances"),
				stages(eb.ref("PubsInStages.stageId")).as("stages"),
			])
			.where("parentId", "=", parentId)
	);
};
