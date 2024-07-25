"use server";

import type { FormsId, Users, UsersId } from "db/public";
import { MemberRole } from "db/public";
import { logger } from "logger";
import { assert } from "utils";

import type { XOR } from "~/lib/types";
import { createUserWithMembership } from "~/app/c/[communitySlug]/members/[[...add]]/actions";
import { createMagicLink } from "~/lib/auth/createMagicLink";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import {
	addUserToForm,
	createFormInviteLink,
	getForm,
	userHasPermissionToForm,
} from "~/lib/server/form";
import { smtpclient } from "~/lib/server/mailgun";

export const inviteUserToForm = defineServerAction(async function inviteUserToForm({
	email,
	...formSlugOrId
}: {
	email: string;
} & XOR<{ slug: string }, { id: FormsId }>) {
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

	const link = await createFormInviteLink({ formSlug: form.slug, email });

	await smtpclient.sendMail({
		from: "hello@pubpub.org",
		to: email,
		subject: "Link to form",
		text: `You have been invited to fill in the form ${form.name} on PubPub. Click the link below to accept the invitation

		${link}
		`,
	});
});
