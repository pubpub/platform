"use server";

import { redirect } from "next/navigation";

import type { CommunitiesId, PubTypesId } from "db/public";
import { assert } from "utils";

import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { FORM_SLUG_UNIQUE_CONSTRAINT, insertForm } from "~/lib/server/form";

export const createForm = defineServerAction(async function createForm(
	pubTypeId: PubTypesId,
	name: string,
	slug: string,
	communityId: CommunitiesId
) {
	const user = await getLoginData();

	if (!user) {
		return {
			error: "Not logged in",
		};
	}

	try {
		await autoRevalidate(
			insertForm(pubTypeId, name, slug, communityId, false)
		).executeTakeFirstOrThrow();
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			const column = error.constraint === FORM_SLUG_UNIQUE_CONSTRAINT ? "slug" : "name";
			return { error: `A form with this ${column} already exists. Choose a new ${column}` };
		}
		return { error: "Form creation failed", cause: error };
	}

	const community = await findCommunityBySlug();
	assert(community);
	redirect(`/c/${community.slug}/forms/${slug}/edit`);
});
