"use server";

import type { CommunitiesId, PubFieldsId, PubTypesId } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";

import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { defaultFormName, defaultFormSlug } from "~/lib/form";
import { ApiError } from "~/lib/server";
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
		db.insertInto("_PubFieldToPubType").values({
			A: pubFieldId,
			B: pubTypeId,
		})
	).execute();
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
	titleField: PubFieldsId
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
		Capabilities.createPubType,
		{ type: MembershipType.community, communityId: community.id },
		user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}
	try {
		await db.transaction().execute(async (trx) => {
			const pubType = await autoRevalidate(
				trx
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
						fields.map((id) => ({
							A: id,
							B: eb.selectFrom("newType").select("id"),
							isTitle: titleField === id,
						}))
					)
					.returning("B as id")
			).executeTakeFirstOrThrow();

			await autoRevalidate(
				insertForm(
					pubType.id,
					defaultFormName(name),
					defaultFormSlug(name),
					communityId,
					true,
					trx
				)
			).executeTakeFirstOrThrow();
		});
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
		return { error: "Pub type creation failed", cause: error };
	}
});
