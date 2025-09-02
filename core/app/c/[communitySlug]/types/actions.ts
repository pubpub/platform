"use server";

import type { CommunitiesId, PubFieldsId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { defaultFormName, defaultFormSlug } from "~/lib/form";
import { ApiError, createPubTypeWithDefaultForm } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { FORM_NAME_UNIQUE_CONSTRAINT, FORM_SLUG_UNIQUE_CONSTRAINT } from "~/lib/server/form";

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
			return createPubTypeWithDefaultForm(
				{
					communityId,
					name,
					description,
					fields,
					titleField,
				},
				trx
			);
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
