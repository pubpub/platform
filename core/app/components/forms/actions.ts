"use server";

import type { CommunitiesId, FormsId, PubsId } from "db/public";
import { logger } from "logger";

import type { XOR } from "~/lib/types";
import { getLoginData } from "~/lib/authentication/loginData";
import { env } from "~/lib/env/env";
import { ApiError, generateSignedAssetUploadUrl } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import * as Email from "~/lib/server/email";
import { createFormInviteLink, getForm, userHasPermissionToForm } from "~/lib/server/form";
import { TokenFailureReason, validateTokenSafe } from "~/lib/server/token";

export const upload = defineServerAction(async function upload(pubId: string, fileName: string) {
	if (env.FLAGS?.get("uploads") === false) {
		return ApiError.FEATURE_DISABLED;
	}

	const loginData = await getLoginData();

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}
	// TODO: authorization check?

	return await generateSignedAssetUploadUrl(pubId as PubsId, fileName);
});

export const inviteUserToForm = defineServerAction(async function inviteUserToForm({
	token,
	pubId,
	communityId,
	...formSlugOrId
}: {
	token: string;
	pubId: PubsId;
	communityId: CommunitiesId;
} & XOR<{ slug: string }, { id: FormsId }>) {
	const community = await findCommunityBySlug();
	if (!community) {
		throw new Error("Invite user to form failed because community not found");
	}

	const form = await getForm({ ...formSlugOrId, communityId }).executeTakeFirst();

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
		pubId,
	});

	if (!canAccessForm) {
		logger.error({ msg: "error adding user to form" });
		return { error: `You do not have permission to access form ${form.slug}` };
	}

	const formInviteLink = await createFormInviteLink({
		formId: form.id,
		userId: result.user.id,
		communityId,
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
