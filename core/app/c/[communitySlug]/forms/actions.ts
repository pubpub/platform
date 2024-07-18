"use server";

import type { CommunitiesId, FormsId, PubTypesId, UsersId } from "db/public";
import { logger } from "logger";

import { db, isUniqueConstraintError } from "~/kysely/database";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { getForm } from "~/lib/server/form";
import { getUser } from "~/lib/server/user";
import { slugifyString } from "~/lib/string";
import { inviteUserToForm } from "../../(public)/[communitySlug]/public/forms/[formSlug]/actions";

export const createForm = defineServerAction(async function createForm(
	pubTypeId: PubTypesId,
	name: string,
	communityId: CommunitiesId
) {
	try {
		const { slug } = await autoRevalidate(
			db
				.insertInto("forms")
				.values({
					name,
					pubTypeId,
					slug: slugifyString(name),
					communityId,
				})
				.returning("slug")
		).executeTakeFirstOrThrow();
		return slug;
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			const column = error.constraint === "forms_slug_key" ? "slug" : "name";
			return { error: `A form with this ${column} already exists. Choose a new name` };
		}
		logger.error({ msg: "error creating form", error });
		return { error: "Form creation failed" };
	}
});

export const archiveForm = defineServerAction(async function archiveForm(id: FormsId) {
	try {
		await autoRevalidate(
			db.updateTable("forms").set({ isArchived: true }).where("forms.id", "=", id)
		).executeTakeFirstOrThrow();
	} catch (error) {
		logger.error({ msg: "error archiving form", error });
		return { error: "Unable to archive form" };
	}
});

export const addUserToForm = defineServerAction(async function addUserToForm({
	userId,
	...formSlugOrId
}: {
	userId: UsersId;
} & (
	| {
			slug: string;
			id?: never;
	  }
	| {
			id: FormsId;
			slug?: never;
	  }
)) {
	const communitySlug = getCommunitySlug();
	const community = await findCommunityBySlug(communitySlug);
	if (!community) {
		return { error: "Community not found" };
	}

	try {
		const form = await getForm(formSlugOrId).executeTakeFirstOrThrow();

		await autoRevalidate(
			db
				.with("current_member", (db) =>
					db
						.selectFrom("members")
						.selectAll()
						.where("members.userId", "=", userId)
						.where("members.communityId", "=", community.id)
				)
				.with("new_permission", (db) =>
					db
						.insertInto("permissions")
						.values((eb) => ({
							memberId: eb.selectFrom("current_member").select("current_member.id"),
						}))
						.returning("id")
				)
				.insertInto("_FormToPermission")
				.values((eb) => ({
					A: form.id,
					B: eb.selectFrom("new_permission").select("new_permission.id"),
				}))
				.returning(["A as formId", "B as permissionId"])
		).executeTakeFirstOrThrow();

		const user = await getUser({ id: userId }).executeTakeFirstOrThrow();

		await inviteUserToForm({
			communitySlug,
			email: user.email,
			...formSlugOrId,
		});
	} catch (error) {
		logger.error({ msg: "error adding user to form", error });
		return { error: "Unable to add user to form" };
	}
});
