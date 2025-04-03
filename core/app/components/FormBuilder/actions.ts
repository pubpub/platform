"use server";

import type { FormElementsId, FormsId, NewFormElements } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { logger } from "logger";

import type { FormBuilderSchema } from "./types";
import type { QB } from "~/lib/server/cache/types";
import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { ApiError } from "~/lib/server";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const saveForm = defineServerAction(async function saveForm(form: {
	formId: FormsId;
	upserts: NewFormElements[];
	deletes: FormElementsId[];
	access?: FormBuilderSchema["access"];
}) {
	const loginData = await getLoginData();

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const community = await findCommunityBySlug();

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}

	const authorized = await userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		loginData.user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	const { formId, upserts, deletes, access } = form;

	logger.info({ msg: "saving form", form, upserts, deletes });
	if (!upserts.length && !deletes.length && !access) {
		return;
	}
	try {
		const result = await db.transaction().execute(async (trx) => {
			let query = trx as unknown;

			if (upserts.length) {
				query = (query as typeof trx).with("upserts", (db) =>
					db
						.insertInto("form_elements")
						.values(upserts)
						.onConflict((oc) =>
							oc.column("id").doUpdateSet((eb) => {
								const keys = Object.keys(upserts[0]) as (keyof NewFormElements)[];
								return Object.fromEntries(
									keys.map((key) => [key, eb.ref(`excluded.${key}`)])
								);
							})
						)
				);
			}

			if (deletes.length) {
				query = (query as typeof trx).with("deletes", (db) =>
					db.deleteFrom("form_elements").where("form_elements.id", "in", deletes)
				);
			}

			if (access) {
				query = (query as typeof trx)
					.updateTable("forms")
					.set({ access })
					.where("forms.id", "=", formId);
			} else {
				query = (query as typeof trx)
					.selectFrom("forms")
					.select("id")
					.where("forms.id", "=", formId);
			}

			const result = await autoRevalidate(query as QB<any>).executeTakeFirstOrThrow();

			return result;
		});

		return {
			success: true,
		};
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			return { error: `An element with this label already exists. Choose a new name` };
		}
		logger.error({ msg: "error saving form", error });
		return { error: "Unable to save form" };
	}
});

export const archiveForm = defineServerAction(async function archiveForm(id: FormsId) {
	const loginData = await getLoginData();

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const community = await findCommunityBySlug();

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}

	const authorized = await userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		loginData.user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	try {
		await autoRevalidate(
			db.updateTable("forms").set({ isArchived: true }).where("forms.id", "=", id)
		).executeTakeFirstOrThrow();
	} catch (error) {
		return { error: "Unable to archive form", cause: error };
	}
});

export const restoreForm = defineServerAction(async function unarchiveForm(id: FormsId) {
	const loginData = await getLoginData();

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const community = await findCommunityBySlug();

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}

	const authorized = await userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		loginData.user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	try {
		await autoRevalidate(
			db.updateTable("forms").set({ isArchived: false }).where("forms.id", "=", id)
		).executeTakeFirstOrThrow();
	} catch (error) {
		return { error: "Unable to unarchive form", cause: error };
	}
});
