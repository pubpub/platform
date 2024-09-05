"use server";

import type { FormsId, PubsId } from "db/public";
import { logger } from "logger";

import type { XOR } from "~/lib/types";
import { generateSignedAssetUploadUrl } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import * as Email from "~/lib/server/email";
import { createFormInviteLink, getForm, userHasPermissionToForm } from "~/lib/server/form";
import { TokenFailureReason, validateTokenSafe } from "~/lib/server/token";

export const upload = defineServerAction(async function upload(pubId: string, fileName: string) {
	return await generateSignedAssetUploadUrl(pubId, fileName);
});

export const inviteUserToForm = defineServerAction(async function inviteUserToForm({
	token,
	pubId,
	...formSlugOrId
}: {
	token: string;
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

	const result = await validateTokenSafe(token);

	if (result.isValid || result.reason !== TokenFailureReason.expired || !result.user) {
		return { error: "Invalid token" };
	}

	const canAccessForm = await userHasPermissionToForm({
		userId: result.user.id,
		formId: form.id,
	});

	if (!canAccessForm) {
		logger.error({ msg: "error adding user to form" });
		return { error: `You do not have permission to access form ${form.slug}` };
	}

	const formInviteLink = await createFormInviteLink({
		formId: form.id,
		userId: result.user.id,
		pubId,
	});

	await Email.requestAccessToForm({
		community,
		form,
		formInviteLink,
		to: result.user.email,
		subject: `Access to ${form.name}`,
	}).send();
});
