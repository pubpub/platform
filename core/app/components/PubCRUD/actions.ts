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
		const createNewPub = await db
			.with("new_pub", (db) =>
				db
					.insertInto("pubs")
					.values({
						community_id: communityId,
						pub_type_id: pubTypeId,
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
					field_id: key as PubFieldsId,
					pub_id: eb.selectFrom("new_pub").select("new_pub.id"),
					value: JSON.stringify(value.value),
				}))
			)
			.execute();

		if (path) {
			revalidatePath(path);
		}
		revalidateTag(`community-stages_${communityId}`);

		return {
			success: true,
			report: `Successfully created a new Pub`,
		};
	} catch (error) {
		logger.debug(error);
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
			.where("pub_values.pub_id", "=", pubId)
			.execute();

		const updatePub = await Promise.allSettled(
			[
				db
					.updateTable("PubsInStages")
					.set({ stageId })
					.where("PubsInStages.pubId", "=", pubId)
					.execute(),
				pubValues.map(async (pubValue) =>
					db
						.updateTable("pub_values")
						.set({
							value: JSON.stringify(fields[pubValue.field_id].value),
						})
						.where("pub_values.id", "=", pubValue.id)
						.returningAll()
						.execute()
				),
			].flat()
		);

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
		revalidateTag(`community-stages_${communityId}`);

		return {
			success: true,
			report: `Successfully updated the Pub`,
		};
	} catch (error) {
		logger.debug(error);
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
		!loginData.memberships.find((m) => m.communityId === pub.community_id)?.canAdmin &&
		!loginData.isSuperAdmin
	) {
		return {
			error: "You need to be an admin of this community to remove this pub.",
		};
	}

	try {
		await db.deleteFrom("pubs").where("pubs.id", "=", pubId).executeTakeFirst();

		if (path) {
			revalidatePath(path);
		}
		revalidateTag(`community-stages_${pub.community_id}`);

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
