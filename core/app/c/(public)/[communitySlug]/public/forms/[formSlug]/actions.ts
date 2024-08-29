"use server";

import type { FormsId, PubsId } from "db/public";
import { logger } from "logger";

import type { XOR } from "~/lib/types";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { Email } from "~/lib/server/email";
import { getForm, userHasPermissionToForm } from "~/lib/server/form";

export const inviteUserToForm = defineServerAction(async function inviteUserToForm({
	email,
	pubId,
	...formSlugOrId
}: {
	email: string;
	pubId: PubsId;
} & XOR<{ slug: string }, { id: FormsId }>) {
	const community = await findCommunityBySlug();
	if (!community) {
		throw new Error("Invite user to form failed because community not found");
	}

	const form = await getForm(formSlugOrId).executeTakeFirst();

	if (!form) {
		return { error: `No form found with ${formSlugOrId}` };
	}

	const canAccessForm = await userHasPermissionToForm({
		email,
		formId: form.id,
	});

	if (!canAccessForm) {
		logger.error({ msg: "error adding user to form" });
		return { error: `You do not have permission to access form ${form.slug}` };
	}

	await Email.requestAccessToForm({
		community,
		formSlug: form.slug,
		form: {
			name: form.name,
		},
		email,
		to: email,
		subject: `Access to ${form.name}`,
		pubId,
	}).send();
});
