"use server";

import type {
	FormButtonsId,
	FormInputsId,
	FormsId,
	FormStructuralElementsId,
	NewFormInputToPubType,
} from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { logger } from "logger";

import type {
	FormBuilderButtonElement,
	FormBuilderInputElement,
	FormBuilderSchema,
	FormBuilderStructuralElement,
	FormElementData,
} from "./types";
import type { QB } from "~/lib/server/cache/types";
import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { ApiError } from "~/lib/server";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";

const upsertRelatedPubTypes = async (
	values: NewFormInputToPubType[],
	deletedRelatedPubTypes: FormInputsId[],
	trx = db
) => {
	const formElementIds = [...values.map((v) => v.A), ...deletedRelatedPubTypes];

	if (formElementIds.length) {
		// Delete old values
		await trx.deleteFrom("_FormInputToPubType").where("A", "in", formElementIds).execute();
	}

	// Insert new ones
	if (values.length) {
		await trx.insertInto("_FormInputToPubType").values(values).execute();
	}
};

export const saveForm = defineServerAction(async function saveForm(form: {
	formId: FormsId;
	upserts: {
		inputs: FormBuilderInputElement[];
		structure: FormBuilderStructuralElement[];
		buttons: FormBuilderButtonElement[];
	};
	deletes: {
		inputs: FormInputsId[];
		structure: FormStructuralElementsId[];
		buttons: FormButtonsId[];
	};
	relatedPubTypes: NewFormInputToPubType[];
	deletedRelatedPubTypes: FormInputsId[];
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

	const { formId, upserts, deletes, access, relatedPubTypes, deletedRelatedPubTypes } = form;

	logger.info({ msg: "saving form", form, upserts, deletes });
	if (!Object.values(upserts).flat().length && !Object.values(deletes).flat().length && !access) {
		return;
	}
	try {
		const result = await db.transaction().execute(async (trx) => {
			let query = trx as unknown;

			if (upserts?.inputs.length) {
				query = (query as typeof trx).with("upserts", (db) =>
					db
						.insertInto("form_inputs")
						.values(
							upserts.inputs.map(({ elementId, ...input }) => ({
								...input,
								id: elementId,
							}))
						)
						.onConflict((oc) =>
							oc.column("id").doUpdateSet((eb) => {
								const keys = Object.keys(upserts.inputs[0]) as (keyof Omit<
									FormBuilderInputElement,
									"deleted" | "updated" | "configured" | "schemaName"
								>)[];

								return Object.fromEntries(
									keys.map((key) => [key, eb.ref(`excluded.${key}`)])
								);
							})
						)
				);
			}

			if (upserts?.structure.length) {
				query = (query as typeof trx).with("upserts", (db) =>
					db
						.insertInto("form_structural_elements")
						.values(
							upserts.structure.map(({ elementId, ...input }) => ({
								...input,
								id: elementId,
							}))
						)
						.onConflict((oc) =>
							oc.column("id").doUpdateSet((eb) => {
								const keys = Object.keys(
									upserts.structure[0]
								) as (keyof FormBuilderStructuralElement)[];

								return Object.fromEntries(
									keys.map((key) => [key, eb.ref(`excluded.${key}`)])
								);
							})
						)
				);
			}

			if (upserts?.buttons.length) {
				query = (query as typeof trx).with("upserts", (db) =>
					db
						.insertInto("form_buttons")
						.values(
							upserts.buttons.map(({ elementId, ...input }) => ({
								...input,
								id: elementId,
							}))
						)
						.onConflict((oc) =>
							oc.column("id").doUpdateSet((eb) => {
								const keys = Object.keys(
									upserts.buttons[0]
								) as (keyof FormBuilderButtonElement)[];

								return Object.fromEntries(
									keys.map((key) => [key, eb.ref(`excluded.${key}`)])
								);
							})
						)
				);
			}

			if (deletes?.inputs.length) {
				query = (query as typeof trx).with("deletes", (db) =>
					db.deleteFrom("form_inputs").where("form_inputs.id", "in", deletes.inputs)
				);
			}

			if (deletes?.structure.length) {
				query = (query as typeof trx).with("deletes", (db) =>
					db
						.deleteFrom("form_structural_elements")
						.where("form_structural_elements.id", "in", deletes.structure)
				);
			}

			if (deletes?.buttons.length) {
				query = (query as typeof trx).with("deletes", (db) =>
					db.deleteFrom("form_buttons").where("form_buttons.id", "in", deletes.buttons)
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

			await upsertRelatedPubTypes(relatedPubTypes, deletedRelatedPubTypes, trx);

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
