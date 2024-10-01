"use server";

import { revalidatePath } from "next/cache";

import type { CommunitiesId, PubsId, PubTypesId, StagesId } from "db/public";
import { logger } from "logger";

import type { PubValues } from "~/lib/server";
import { validatePubValuesBySchemaName } from "~/actions/_lib/validateFields";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { isCommunityAdmin } from "~/lib/auth/roles";
import { autoCache } from "~/lib/server/cache/autoCache";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const createPub = defineServerAction(async function createPub({
	communityId,
	stageId,
	pubTypeId,
	pubValues,
	path,
	parentId,
	pubId,
}: {
	communityId: CommunitiesId;
	stageId: StagesId;
	pubTypeId: PubTypesId;
	pubValues: PubValues;
	path?: string | null;
	parentId?: PubsId;
	pubId?: PubsId;
}) {
	const { user } = await getLoginData();
	if (!user) {
		throw new Error("Not logged in");
	}

	if (!isCommunityAdmin(user, { id: communityId })) {
		return {
			error: "You need to be an admin",
		};
	}

	const pubValueEntries = Object.entries(pubValues);

	try {
		const query = db
			.with("new_pub", (db) =>
				db
					.insertInto("pubs")
					.values({
						id: pubId,
						communityId: communityId,
						pubTypeId: pubTypeId,
						parentId: parentId,
					})
					.returning("id")
			)
			.with("stage_create", (db) =>
				db.insertInto("PubsInStages").values((eb) => ({
					pubId: eb.selectFrom("new_pub").select("new_pub.id"),
					stageId,
				}))
			);

		await autoRevalidate(
			// Running an `insertInto` with an empty array results in a SQL syntax
			// error. I was not able to find a way to generate the insert into
			// statement only if the array has on or more values. So I extracted the
			// CTEs into a partial query builder above, then conditionally attach the
			// insertInto if there are values, otherwise perform a null select to
			// produce valid SQL.
			pubValueEntries.length > 0
				? query.insertInto("pub_values").values((eb) =>
						pubValueEntries.map(([pubFieldSlug, pubValue]) => ({
							pubId: eb.selectFrom("new_pub").select("new_pub.id"),
							value: JSON.stringify(pubValue),
							fieldId: eb
								.selectFrom("pub_fields")
								.where("pub_fields.slug", "=", pubFieldSlug)
								.select("pub_fields.id"),
						}))
					)
				: query.selectFrom("new_pub").select([])
		).execute();

		if (path) {
			revalidatePath(path);
		}

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

export const _updatePub = async ({
	pubId,
	pubValues,
	stageId,
	pubTypeId,
}: {
	pubId: PubsId;
	pubValues: PubValues;
	stageId?: StagesId;
	pubTypeId?: PubTypesId;
}) => {
	const result = await db.transaction().execute(async (trx) => {
		// Update the stage if a target stage was provided.
		if (stageId !== undefined) {
			await autoRevalidate(
				trx.deleteFrom("PubsInStages").where("PubsInStages.pubId", "=", pubId)
			).execute();
			await autoRevalidate(
				trx.insertInto("PubsInStages").values({ pubId, stageId })
			).execute();
		}

		// Update the pub type if a pub type was provided.
		if (pubId !== undefined) {
			await autoRevalidate(
				trx.updateTable("pubs").set({ pubTypeId }).where("id", "=", pubId)
			).execute();
		}

		// First query for existing values so we know whether to insert or update.
		// Also get the schemaName for validation. We want the fields that may not be in the pub, too.
		const toBeUpdatedPubFieldSlugs = Object.keys(pubValues);

		if (!toBeUpdatedPubFieldSlugs.length) {
			return {
				success: true,
				report: "Pub updated successfully",
			};
		}

		const existingPubFieldValues = await autoCache(
			trx
				.selectFrom("pub_fields")
				.leftJoin("pub_values", "pub_values.fieldId", "pub_fields.id")
				.where("pub_fields.slug", "in", toBeUpdatedPubFieldSlugs)
				.distinctOn("pub_fields.id")
				.orderBy(["pub_fields.id", "pub_values.createdAt desc"])
				.select([
					"pub_values.id as pubValueId",
					"pub_values.pubId",
					"pub_fields.slug",
					"pub_fields.name",
					"pub_fields.schemaName",
				])
				.where("pub_fields.isRelation", "=", false)
		).execute();

		const validated = validatePubValuesBySchemaName({
			fields: existingPubFieldValues,
			values: pubValues,
		});

		if (validated && validated.error) {
			return {
				error: validated.error,
				cause: validated.error,
			};
		}

		try {
			// Insert, update on conflict
			await autoRevalidate(
				trx
					.insertInto("pub_values")
					.values((eb) =>
						Object.entries(pubValues).map(([pubFieldSlug, pubValue]) => ({
							id:
								existingPubFieldValues.find(
									(pubFieldValue) =>
										pubFieldValue.slug === pubFieldSlug &&
										pubFieldValue.pubId === pubId
								)?.pubValueId ?? undefined,
							pubId,
							value: JSON.stringify(pubValue),
							fieldId: eb
								.selectFrom("pub_fields")
								.where("pub_fields.slug", "=", pubFieldSlug)
								.select("pub_fields.id"),
						}))
					)
					.onConflict((oc) =>
						oc.column("id").doUpdateSet((eb) => ({
							value: eb.ref("excluded.value"),
						}))
					)
					.returningAll()
			).execute();
		} catch (error) {
			return {
				title: "Failed to update pub",
				error: `${error.reason}`,
				cause: error,
			};
		}

		return {
			success: true,
			report: "Pub updated successfully",
		};
	});

	return result;
};

export const updatePub = defineServerAction(async function updatePub({
	pubId,
	pubTypeId,
	pubValues,
	stageId,
}: {
	pubId: PubsId;
	pubTypeId?: PubTypesId;
	pubValues: PubValues;
	stageId?: StagesId;
}) {
	const loginData = await getLoginData();

	if (!loginData) {
		throw new Error("Not logged in");
	}

	try {
		const result = await _updatePub({ pubId, pubTypeId, pubValues, stageId });

		return result;
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
	const { user } = await getLoginData();

	if (!user) {
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

	if (!isCommunityAdmin(user, { id: pub.communityId })) {
		return {
			error: "You need to be an admin of this community to remove this pub.",
		};
	}

	try {
		await autoRevalidate(db.deleteFrom("pubs").where("pubs.id", "=", pubId)).executeTakeFirst();

		if (path) {
			revalidatePath(path);
		}
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
