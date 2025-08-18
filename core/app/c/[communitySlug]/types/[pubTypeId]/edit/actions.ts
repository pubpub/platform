"use server";

import { sql } from "kysely";

import type { PubFieldsId, PubTypesId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { ApiError } from "~/lib/server";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const updatePubType = defineServerAction(async function updatePubType(opts: {
	pubTypeId: PubTypesId;
	name?: string;
	description?: string | undefined;
	fields: {
		id: PubFieldsId;
		rank: string;
		deleted: boolean;
		isTitle: boolean;
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

	const { pubTypeId, name, description, fields } = opts;

	const fieldsToDelete = fields.filter((field) => field.deleted);

	const fieldsToUpsert = fields
		.filter((field) => !field.deleted)
		.map((field) => ({
			...field,
			isTitle: field.isTitle,
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
				if (fieldsToUpsert.some((field) => field.isTitle)) {
					// if one of the upserts has a isTitle: true,
					// we first unset the isTitle for all other fields
					// this prevents ordering issues when we set an earlier field as title and then a later one as not title
					// { isTitle: true, rank: 0 } and { isTitle: false, rank: 1 }
					await autoRevalidate(
						trx
							.updateTable("_PubFieldToPubType")
							.set({ isTitle: false })
							.where("B", "=", pubTypeId)
					).execute();
				}

				await autoRevalidate(
					trx
						.insertInto("_PubFieldToPubType")
						.values(
							fieldsToUpsert.map((field) => ({
								A: field.id,
								B: pubTypeId,
								isTitle: field.isTitle,
								rank: field.rank,
							}))
						)
						.onConflict((b) =>
							b.columns(["A", "B"]).doUpdateSet((eb) => ({
								isTitle: sql<boolean>`excluded."isTitle"`,
								rank: sql<string>`excluded.rank`,
							}))
						)
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
