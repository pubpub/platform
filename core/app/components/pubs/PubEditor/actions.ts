"use server";

import { revalidatePath } from "next/cache";

import type { CommunitiesId, PubsId, PubTypesId, StagesId } from "db/public";
import { logger } from "logger";

import type { PubValues } from "~/lib/server";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { isCommunityAdmin } from "~/lib/auth/roles";
import { createPubRecursiveNew } from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { validatePubValuesBySchemaName } from "~/lib/server/validateFields";

export const createPubRecursive = defineServerAction(async function createPubRecursive(
	...[props]: Parameters<typeof createPubRecursiveNew>
) {
	const { user } = await getLoginData();
	if (!user) {
		throw new Error("Not logged in");
	}

	if (!isCommunityAdmin(user, { id: props.communityId })) {
		return {
			error: "You need to be an admin",
		};
	}
	try {
		await createPubRecursiveNew(props);
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
	continueOnValidationError,
}: {
	pubId: PubsId;
	pubValues: PubValues;
	stageId?: StagesId;
	pubTypeId?: PubTypesId;
	continueOnValidationError: boolean;
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
				.leftJoin("pub_values", (join) =>
					join
						.onRef("pub_values.fieldId", "=", "pub_fields.id")
						.on("pub_values.pubId", "=", pubId)
				)
				.where("pub_fields.slug", "in", toBeUpdatedPubFieldSlugs)
				.where("pub_fields.isRelation", "=", false)
				.select([
					"pub_values.id as pubValueId",
					"pub_fields.slug",
					"pub_fields.name",
					"pub_fields.schemaName",
				])
		).execute();

		const validationErrors = validatePubValuesBySchemaName({
			fields: existingPubFieldValues,
			values: pubValues,
		});

		const invalidValueSlugs = Object.keys(validationErrors);
		if (invalidValueSlugs.length) {
			if (continueOnValidationError) {
				for (const slug of invalidValueSlugs) {
					delete pubValues[slug];
				}
			} else {
				throw new Error(Object.values(validationErrors).join(" "));
			}
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
									(pubFieldValue) => pubFieldValue.slug === pubFieldSlug
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
	continueOnValidationError,
}: {
	pubId: PubsId;
	pubTypeId?: PubTypesId;
	pubValues: PubValues;
	stageId?: StagesId;
	continueOnValidationError: boolean;
}) {
	const loginData = await getLoginData();

	if (!loginData) {
		throw new Error("Not logged in");
	}

	try {
		const result = await _updatePub({
			pubId,
			pubTypeId,
			pubValues,
			stageId,
			continueOnValidationError,
		});

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
