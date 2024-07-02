"use server";

import type { JSONSchemaType } from "ajv";

import { revalidatePath, revalidateTag } from "next/cache";
import { jsonBuildObject, jsonObjectFrom } from "kysely/helpers/postgres";

import type { JsonValue } from "contracts";
import { logger } from "logger";

import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { PubTypesId } from "~/kysely/types/public/PubTypes";
import type { StagesId } from "~/kysely/types/public/Stages";
import { validatePubValues } from "~/actions/_lib/validateFields";
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
	stageId,
	pubId,
	fields,
}: {
	stageId?: StagesId;
	pubId: PubsId;
	fields: { slug: string; value: JsonValue }[];
}) => {
	const toBeUpdatedPubFieldSlugs = fields.map(({ slug }) => slug);

	// get all values and field schemas for the slugs in fields
	const existingPubValues = await db
		.selectFrom("pub_fields")
		.leftJoin("pub_values", "pub_values.fieldId", "pub_fields.id")
		.where("pub_fields.slug", "in", toBeUpdatedPubFieldSlugs)
		.where("pub_values.pubId", "=", pubId)
		.distinctOn("pub_fields.id")
		.orderBy(["pub_fields.id", "pub_values.createdAt desc"])
		.select((eb) => [
			"pub_values.value",
			jsonBuildObject({
				slug: eb.ref("pub_fields.slug"),
				id: eb.ref("pub_fields.id"),
				name: eb.ref("name"),
				schema: jsonObjectFrom(
					eb
						.selectFrom("PubFieldSchema")
						.selectAll("PubFieldSchema")
						.whereRef("PubFieldSchema.id", "=", "pub_fields.pubFieldSchemaId")
				),
			}).as("field"),
		])
		.execute();

	const valueUpdates = fields.filter((field) => {
		const existingValue = existingPubValues.find(
			(pubValue) => pubValue.field.slug === field.slug
		);
		if (!field.value) {
			return !!existingValue; // If "" is returned, update existing value to ""
		}

		return field.value !== existingValue;
	});

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

	const newValues = Object.fromEntries(
		fields.map(({ slug, value }) => [slug, JSON.stringify(value)])
	);

	const pubFields = existingPubValues
		.map((pubValue) => pubValue.field)
		.filter(
			(
				field
			): // bless this mess
			field is NonNullable<
				typeof field & {
					schema: NonNullable<NonNullable<typeof field>["schema"]> & {
						schema: JSONSchemaType<any>;
					};
				}
			> => field !== null && field.schema !== null && field.schema.schema !== null
		);

	const validated = validatePubValues({
		fields: pubFields,
		values: newValues,
	});

	if (validated && validated.error) {
		return {
			error: validated.error,
			cause: validated.error,
		};
	}

	const valueQuery = autoRevalidate(
		db
			.insertInto("pub_values")
			.values((eb) =>
				valueUpdates.map(({ value, slug }) => ({
					value: JSON.stringify(value),
					pubId,
					fieldId: eb
						.selectFrom("pub_fields")
						.where("pub_fields.slug", "=", slug)
						.select("pub_fields.id"),
				}))
			)
			.returningAll()
	).execute();

	const updatePub = await Promise.allSettled([valueQuery, ...([stageMoveQuery] || [])]);

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
	revalidateTag(`pubs_${pubId}`);

	return {
		success: true,
		report: `Successfully updated the Pub`,
	};
};

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

	const mappedFields = Object.values(fields).map(({ slug, value }) => ({
		slug,
		value,
	}));

	try {
		const result = await _updatePub({ stageId, pubId, fields: mappedFields });
		if (path) {
			revalidatePath(path);
		}

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
