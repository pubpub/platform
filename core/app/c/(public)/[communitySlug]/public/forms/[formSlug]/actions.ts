"use server";

import type { FormsId } from "db/public";

import type { XOR } from "~/lib/types";
import { createMagicLink } from "~/lib/auth/createTempToken";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { getForm, userHasPermissionToForm } from "~/lib/server/form";
import { smtpclient } from "~/lib/server/mailgun";

export const inviteUserToForm = defineServerAction(async function inviteUserToForm({
	communitySlug,
	email,
	...formSlugOrId
}: {
	communitySlug: string;
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
		return { error: `You do not have permission to access form ${form.slug}` };
	}

	const link = await createMagicLink({
		email,
		path: `/c/${communitySlug}/public/forms/${form.slug}?email=${email}`,
	});

	await smtpclient.sendMail({
		from: "hello@pubpub.org",
		to: email,
		subject: "Link to form",
		text: link,
	});
});
