"use server";

import { sql } from "kysely";

import type { CommunitiesId, FormsId, PubsId } from "db/public";
import { logger } from "logger";

import type { XOR } from "~/lib/types";
import { db } from "~/lib/__tests__/db";
import { getLoginData } from "~/lib/authentication/loginData";
import { userHasAccessToForm } from "~/lib/authorization/capabilities";
import { env } from "~/lib/env/env";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { ApiError, deleteFileFromS3, generateSignedAssetUploadUrl } from "~/lib/server";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import * as Email from "~/lib/server/email";
import { createFormInviteLink, getForm, userHasPermissionToForm } from "~/lib/server/form";
import { maybeWithTrx } from "~/lib/server/maybeWithTrx";
import { TokenFailureReason, validateTokenSafe } from "~/lib/server/token";

export const upload = defineServerAction(async function upload(fileName: string, pubId?: PubsId) {
	if (env.FLAGS?.get("uploads") === false) {
		return ApiError.FEATURE_DISABLED;
	}

	const loginData = await getLoginData();

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}
	// TODO: authorization check?

	const signedUrl = await generateSignedAssetUploadUrl(loginData.user.id, fileName, pubId);
	logger.debug({ msg: "generated signed url for asset upload", fileName, signedUrl, pubId });
	return signedUrl;
});

export const deleteFile = defineServerAction(async function deleteFile({
	fileUrl,
	formSlug,
	fieldSlug,
	mode,
	pubId,
}: {
	fileUrl: string;
	formSlug: string;
	fieldSlug: string;
} & (
	| {
			mode: "create";
			pubId?: never;
	  }
	| {
			mode: "edit";
			pubId: PubsId;
	  }
)) {
	if (env.FLAGS?.get("uploads") === false) {
		return ApiError.FEATURE_DISABLED;
	}

	const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()]);

	if (!user || !community) {
		return ApiError.NOT_LOGGED_IN;
	}

	// check if user has permissions to delete file, which is equal to the user being able to edit the pub if it exists, or create it if it doesn't
	const canDeleteFile = await userHasAccessToForm({
		formSlug,
		userId: user.id,
		communityId: community.id,
		// pubid only passed if it's an edit form
		pubId: mode === "edit" ? pubId : undefined,
	});

	if (!canDeleteFile) {
		return ApiError.UNAUTHORIZED;
	}

	try {
		// so we don't delete the file if the pub value is not found
		const res = await maybeWithTrx(db, async (trx) => {
			if (mode === "edit") {
				// delete pubvalue if it exists

				await autoRevalidate(
					trx
						.updateTable("pub_values")
						.where("pub_values.pubId", "=", pubId)
						.where((eb) =>
							eb.exists((eb) =>
								eb
									.selectFrom("pub_fields")
									.select("slug")
									.where("slug", "=", fieldSlug)
							)
						)
						.where(
							(eb) =>
								eb.fn("jsonb_path_exists", [
									"value",
									sql.raw("'$[*] ? (@.fileUploadUrl == $url)'"),
									eb.val(JSON.stringify({ url: fileUrl })),
								]),
							"=",
							true
						)
						.set((eb) => ({
							value: eb.fn("jsonb_path_query_array", [
								"value",
								sql.raw("'$[*] ? (@.fileUploadUrl != $url)'"),
								eb.val(JSON.stringify({ url: fileUrl })),
							]),
							lastModifiedBy: createLastModifiedBy({ userId: user.id }),
						}))
				).execute();
			}

			// delete file from s3
			return deleteFileFromS3(fileUrl);
		});

		return {
			success: true,
			msg: "File deleted successfully",
		};
	} catch (error) {
		logger.error({ msg: "error deleting file", err: error });
		return { error: "Error deleting file" };
	}
});

export const sendNewFormLink = defineServerAction(async function sendNewFormLink({
	token,
	pubId,
	communityId,
	...formSlugOrId
}: {
	token: string;
	pubId?: PubsId;
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

	await Email.formLink({
		community,
		form,
		formInviteLink,
		to: result.user.email,
		subject: `Access to ${form.name}`,
	}).send();
});
