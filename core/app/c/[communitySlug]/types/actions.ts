"use server";

import { sql } from "kysely";

import type { CommunitiesId, PubFieldsId, PubTypesId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { defaultFormName, defaultFormSlug } from "~/lib/form";
import { findRanksBetween } from "~/lib/rank";
import { ApiError, getPubType } from "~/lib/server";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import {
	FORM_NAME_UNIQUE_CONSTRAINT,
	FORM_SLUG_UNIQUE_CONSTRAINT,
	insertForm,
} from "~/lib/server/form";

export const addPubField = defineServerAction(async function addPubField(
	pubTypeId: PubTypesId,
	pubFieldId: PubFieldsId
) {
	const [loginData, community] = await Promise.all([getLoginData(), findCommunityBySlug()]);
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}

	const { user } = loginData;

	const [authorized, pubType] = await Promise.all([
		await userCan(
			Capabilities.editPubType,
			{ type: MembershipType.community, communityId: community.id },
			user.id
		),
		getPubType(pubTypeId).executeTakeFirst(),
	]);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	if (!pubType) {
		return ApiError.PUB_TYPE_NOT_FOUND;
	}

	const newRank = findRanksBetween({
		numberOfRanks: 1,
		start: pubType.fields.at(-1)?.rank ?? "0",
	});

	await autoRevalidate(
		db.insertInto("_PubFieldToPubType").values({
			A: pubFieldId,
			B: pubTypeId,
			rank: newRank[0],
		})
	).execute();
});

export const updatePubType = defineServerAction(async function updatePubType(opts: {
	pubTypeId: PubTypesId;
	name?: string;
	description?: string | undefined;
	titleField?: PubFieldsId | undefined;
	fields: {
		id: PubFieldsId;
		rank: string;
		deleted: boolean;
	}[];
}) {
	const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()]);

	if (!user) {
		return ApiError.NOT_LOGGED_IN;
	}

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}

	const authorized = await userCan(
		Capabilities.editPubType,
		{ type: MembershipType.community, communityId: community.id },
		user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	const { pubTypeId, name, description, titleField, fields } = opts;

	const fieldsToDelete = fields.filter((field) => field.deleted);

	const fieldsToUpsert = fields
		.filter((field) => !field.deleted)
		.map((field) => ({
			...field,
			isTitle: field.id === titleField,
		}));

	try {
		const res = await db.transaction().execute(async (trx) => {
			if (name || description !== undefined) {
				await autoRevalidate(
					trx
						.updateTable("pub_types")
						.set({ name, description })
						.where("id", "=", pubTypeId)
				).execute();
			}

			if (fieldsToDelete.length > 0) {
				await autoRevalidate(
					trx
						.deleteFrom("_PubFieldToPubType")
						.where("B", "=", pubTypeId)
						.where(
							"A",
							"in",
							fieldsToDelete.map((field) => field.id)
						)
				).execute();
			}

			if (fieldsToUpsert.length > 0) {
				await autoRevalidate(
					trx
						.insertInto("_PubFieldToPubType")
						.values(
							fieldsToUpsert.map((field) => ({
								A: field.id,
								B: pubTypeId,
								isTitle: field.id === titleField,
								rank: field.rank,
							}))
						)
						.onConflict((b) =>
							b.columns(["A", "B"]).doUpdateSet((eb) => ({
								isTitle: sql<boolean>`excluded."A" = ${titleField}`,
							}))
						)
				).execute();
			}

			await autoRevalidate(
				trx
					.updateTable("_PubFieldToPubType")
					.set({ isTitle: false })
					.where("B", "=", pubTypeId)
			).execute();

			if (titleField) {
				await autoRevalidate(
					trx
						.updateTable("_PubFieldToPubType")
						.set({ isTitle: true })
						.where("A", "=", titleField)
						.where("B", "=", pubTypeId)
				).execute();
			}
		});

		return {
			data: {},
			success: true,
		};
	} catch (error) {
		logger.error(error);
		return { error: "Pub type update failed", cause: error };
	}
});

export const updateTitleField = defineServerAction(async function updateTitleField(
	pubTypeId: PubTypesId,
	pubFieldId: PubFieldsId
) {
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const { user } = loginData;

	const community = await findCommunityBySlug();

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}

	const authorized = await userCan(
		Capabilities.editPubType,
		{ type: MembershipType.community, communityId: community.id },
		user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	await db.transaction().execute(async (trx) => {
		await autoRevalidate(
			trx.updateTable("_PubFieldToPubType").set({ isTitle: false }).where("B", "=", pubTypeId)
		).execute();
		await autoRevalidate(
			trx
				.updateTable("_PubFieldToPubType")
				.set({ isTitle: true })
				.where("A", "=", pubFieldId)
				.where("B", "=", pubTypeId)
		).execute();
	});
});

export const removePubField = defineServerAction(async function removePubField(
	pubTypeId: PubTypesId,
	pubFieldId: PubFieldsId
) {
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const { user } = loginData;

	const community = await findCommunityBySlug();

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}

	const authorized = await userCan(
		Capabilities.editPubType,
		{ type: MembershipType.community, communityId: community.id },
		user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	await autoRevalidate(
		db.deleteFrom("_PubFieldToPubType").where("A", "=", pubFieldId).where("B", "=", pubTypeId)
	).execute();
});

export const createPubType = defineServerAction(async function createPubType(
	name: string,
	communityId: CommunitiesId,
	description: string | undefined,
	fields: PubFieldsId[],
	titleField?: PubFieldsId
) {
	const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()]);

	if (!user) {
		return ApiError.NOT_LOGGED_IN;
	}

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}

	const authorized = await userCan(
		Capabilities.createPubType,
		{ type: MembershipType.community, communityId: community.id },
		user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}
	try {
		const result = await db.transaction().execute(async (trx) => {
			const ranks = findRanksBetween({
				numberOfRanks: fields.length,
			});
			const query = trx
				.with("newType", (db) =>
					db
						.insertInto("pub_types")
						.values({
							communityId,
							name,
							description,
						})
						.returning("pub_types.id")
				)
				.insertInto("_PubFieldToPubType")
				.values((eb) =>
					fields.map((id, idx) => ({
						A: id,
						B: eb.selectFrom("newType").select("id"),
						isTitle: titleField === id,
						rank: ranks[idx],
					}))
				)
				.returning("B as id");

			const res = await autoRevalidate(query).executeTakeFirstOrThrow();

			const pubType = await getPubType(res.id, trx).executeTakeFirstOrThrow();

			await autoRevalidate(
				insertForm(
					pubType,
					defaultFormName(name),
					defaultFormSlug(name),
					communityId,
					true,
					trx
				)
			).executeTakeFirstOrThrow();

			return pubType;
		});

		return {
			data: result,
			success: true,
		};
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			if (error.table === "pub_types") {
				return { error: "A pub type with this name already exists" };
			}
			if (error.constraint === FORM_NAME_UNIQUE_CONSTRAINT) {
				return {
					error: `Default form creation for pub type failed. There's already a form with the name ${defaultFormName}.`,
				};
			}
			if (error.constraint === FORM_SLUG_UNIQUE_CONSTRAINT) {
				return {
					error: `Default form creation for pub type failed. There's already a form with the slug ${defaultFormSlug}.`,
				};
			}
		}
		logger.error(error);

		return { error: "Pub type creation failed", cause: error };
	}
});
