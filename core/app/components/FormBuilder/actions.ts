"use server";

import type { QueryCreator } from "kysely";

import type { FormElementsId, FormsId, NewFormElements, PublicSchema } from "db/public";
import { formElementsInitializerSchema } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";
import { logger } from "logger";

import type { FormBuilderSchema } from "./types";
import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { ApiError } from "~/lib/server";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const saveForm = defineServerAction(async function saveForm(form: FormBuilderSchema) {
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

	const { elements, formId, access } = form;
	//todo: this logic determines what, if any updates to make. that should be determined on the
	//frontend so we can disable the save button if there are none
	const { upserts, deletes } = elements.reduce<{
		upserts: NewFormElements[];
		deletes: FormElementsId[];
	}>(
		(acc, element, index) => {
			if (element.deleted) {
				if (element.elementId) {
					acc.deletes.push(element.elementId);
				}
			} else if (!element.elementId) {
				// Newly created elements have no elementId
				acc.upserts.push(formElementsInitializerSchema.parse({ formId, ...element }));
			} else if (element.updated || element.order !== index + 1) {
				acc.upserts.push(
					formElementsInitializerSchema.parse({
						...element,
						formId,
						id: element.elementId,
						order: index + 1,
					})
				); // TODO: only update changed columns
			}
			return acc;
		},
		{ upserts: [], deletes: [] }
	);

	logger.info({ msg: "saving form", form, upserts, deletes });
	if (!upserts.length && !deletes.length) {
		return;
	}
	try {
		const deleteQuery = (db: QueryCreator<PublicSchema>) =>
			db.deleteFrom("form_elements").where("form_elements.id", "in", deletes);

		const upsertQuery = (db: QueryCreator<PublicSchema>) =>
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
				);

		if (upserts.length && deletes.length) {
			await autoRevalidate(
				db
					.with("upserts", (db) => upsertQuery(db))
					.with("deletes", (db) =>
						// This isn't type safe, but it doesn't seem like there's any type safe way
						// to reuse a CTE in kysely right now
						deleteQuery(db as unknown as QueryCreator<PublicSchema>)
					)
					.updateTable("forms")
					.set({ access })
					.where("forms.id", "=", formId)
			).executeTakeFirstOrThrow();
		} else if (deletes.length) {
			await autoRevalidate(
				db
					.with("deletes", (db) => deleteQuery(db))
					.updateTable("forms")
					.set({ access })
					.where("forms.id", "=", formId)
			).executeTakeFirstOrThrow();
		} else if (upserts.length) {
			await autoRevalidate(
				db
					.with("upserts", (db) => upsertQuery(db))
					.updateTable("forms")
					.set({ access })
					.where("forms.id", "=", formId)
			).executeTakeFirstOrThrow();
		}
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
