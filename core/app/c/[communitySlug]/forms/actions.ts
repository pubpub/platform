"use server";

import type { CommunitiesId, FormsId, PubTypesId, Users, UsersId } from "db/public";
import { MemberRole } from "db/public";
import { logger } from "logger";
import { assert } from "utils";

import type { XOR } from "~/lib/types";
import { userId } from "~/actions/corePubFields";
import { db, isCheckContraintError, isUniqueConstraintError } from "~/kysely/database";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { getForm } from "~/lib/server/form";
import { getUser } from "~/lib/server/user";
import { slugifyString } from "~/lib/string";
import { inviteUserToForm } from "../../(public)/[communitySlug]/public/forms/[formSlug]/request/actions";
import { createUserWithMembership } from "../members/[[...add]]/actions";

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
