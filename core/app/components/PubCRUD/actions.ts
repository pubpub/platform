"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import type { JsonValue } from "contracts";
import { logger } from "logger";

import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { PubTypesId } from "~/kysely/types/public/PubTypes";
import type { StagesId } from "~/kysely/types/public/Stages";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const createPub = defineServerAction(async function createPub({
	communityId,
	stageId,
	pubTypeId,
	fields,
	path,
}: {
	communityId: CommunitiesId;
	stageId: StagesId;
	pubTypeId: PubTypesId;
	fields: { [id: PubFieldsId]: { slug: string; value: JsonValue } };
	path?: string | null;
}) {
	const loginData = await getLoginData();
	if (!loginData) {
		throw new Error("Not logged in");
	}

	if (
		!loginData.memberships.find((m) => m.communityId === communityId)?.canAdmin &&
		!loginData.isSuperAdmin
	) {
		return {
			error: "You need to be an admin",
		};
	}

	try {
		const createNewPub = await autoRevalidate(
			db
				.with("new_pub", (db) =>
					db
						.insertInto("pubs")
						.values({
							communityId: communityId,
							pubTypeId: pubTypeId,
						})
						.returning("id")
				)
				.with("stage_create", (db) =>
					db.insertInto("PubsInStages").values((eb) => ({
						pubId: eb.selectFrom("new_pub").select("new_pub.id"),
						stageId,
					}))
				)

				.insertInto("pub_values")
				.values((eb) =>
					Object.entries(fields).map(([key, value]) => ({
						fieldId: key as PubFieldsId,
						pubId: eb.selectFrom("new_pub").select("new_pub.id"),
						value: JSON.stringify(value.value),
					}))
				)
		).execute();

		if (path) {
			revalidatePath(path);
		}
		// revalidateTag(`community-stages_${communityId}`);

		return {
			success: true,
			report: `Successfully created a new Pub`,
		};
	} catch (error) {
		logger.error(error);
		return {
			error: "Failed to create pub",
			cause: error,
		};
	}
});

export const updatePub = defineServerAction(async function updatePub({
	communityId,
	pubId,
	fields,
	path,
	stageId,
}: {
	communityId: CommunitiesId;
	pubId: PubsId;
	fields: { [id: PubFieldsId]: { slug: string; value: JsonValue } };
	path?: string | null;
	stageId?: StagesId;
}) {
	const loginData = await getLoginData();
	if (!loginData) {
		throw new Error("Not logged in");
	}

	if (
		!loginData.memberships.find((m) => m.communityId === communityId)?.canAdmin &&
		!loginData.isSuperAdmin
	) {
		return {
			error: "You need to be an admin",
		};
	}

	try {
		const pubValues = await db
			.selectFrom("pub_values")
			.selectAll()
			.where("pub_values.pubId", "=", pubId)
			.execute();

		const stageMoveQuery =
			stageId &&
			autoRevalidate(
				db
					.with("leave-stage", (db) =>
						db.deleteFrom("PubsInStages").where("pubId", "=", pubId)
					)
					.insertInto("PubsInStages")
					.values({ pubId, stageId })
			).execute();

		const queries = [
			pubValues.map(async (pubValue) => {
				const field = fields[pubValue.fieldId];
				if (!field) {
					logger.debug({
						msg: `Field ${pubValue.fieldId} not found in fields`,
						fields,
						pubValue,
					});
					return;
				}
				const { value } = field;

				return autoRevalidate(
					db
						.updateTable("pub_values")
						.set({
							value: JSON.stringify(value),
						})
						.where("pub_values.id", "=", pubValue.id)
						.returningAll()
				).execute();
			}),
		]
			.filter((x) => x != null)
			.flat();

		const updatePub = await Promise.allSettled([...queries, ...([stageMoveQuery] || [])]);

		const errors = updatePub.filter(
			(pubValue): pubValue is typeof pubValue & { status: "rejected" } =>
				pubValue.status === "rejected"
		);
		if (errors.length > 0) {
			return {
				title: "Failed to update pub",
				error: `${errors[0]?.reason}`,
				cause: errors,
			};
		}

		if (path) {
			revalidatePath(path);
		}
		// revalidateTag(`community-stages_${communityId}`);

		return {
			success: true,
			report: `Successfully updated the Pub`,
		};
	} catch (error) {
		logger.error(error);
		return {
			error: "Failed to update pub",
			cause: error,
		};
	}
});

export const removePub = defineServerAction(async function removePub({
	pubId,
	path,
}: {
	pubId: PubsId;
	path?: string | null;
}) {
	const loginData = await getLoginData();

	if (!loginData) {
		throw new Error("Not logged in");
	}
	const pub = await db
		.selectFrom("pubs")
		.selectAll()
		.where("pubs.id", "=", pubId)
		.executeTakeFirst();

	if (!pub) {
		return {
			error: "Pub not found",
		};
	}

	if (
		!loginData.memberships.find((m) => m.communityId === pub.communityId)?.canAdmin &&
		!loginData.isSuperAdmin
	) {
		return {
			error: "You need to be an admin of this community to remove this pub.",
		};
	}

	try {
		const guy = await autoRevalidate(
			db.deleteFrom("pubs").where("pubs.id", "=", pubId).returningAll()
		).executeTakeFirst();

		if (path) {
			revalidatePath(path);
		}
		// revalidateTag(`community-stages_${pub.community_id}`);

		return {
			success: true,
			report: `Successfully removed the pub`,
		};
	} catch (error) {
		logger.debug(error);
		return {
			error: "Failed to remove pub",
			cause: error,
		};
	}
});
