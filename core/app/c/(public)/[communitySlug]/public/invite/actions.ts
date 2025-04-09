"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { tryCatch } from "utils/try-catch";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { InviteService } from "~/lib/server/invites/InviteService";
import { redirectToCommunitySignup, redirectToLogin } from "~/lib/server/navigation/redirects";

// Schema for the invite token
const inviteTokenSchema = z.string().min(1);

export const acceptInviteAction = defineServerAction(async function acceptInvite({
	inviteToken,
	redirectTo,
}: {
	inviteToken: string;
	redirectTo: string;
}) {
	const tokenResult = inviteTokenSchema.safeParse(inviteToken);
	if (!tokenResult.success) {
		return {
			success: false,
			error: "Invalid invite token",
		};
	}

	const community = await findCommunityBySlug();

	if (!community) {
		return {
			success: false,
			error: "Community not found",
		};
	}

	const { invite, user } = await InviteService.getValidInviteForLoggedInUser(inviteToken);

	if (!user) {
		if (invite.userId) {
			// redirect to login
			redirectToLogin({
				redirectTo,
				loginNotice: {
					type: "notice",
					title: "You need to log in in order to accept this invite",
				},
			});
			throw new Error("User invite");
		}

		// If user is not logged in, create a signup link and redirect to it
		await redirectToCommunitySignup({
			redirectTo,
			inviteToken,
			notice: {
				type: "notice",
				title: "You need to create an account in order to accept this invite",
			},
		});
		throw new Error("Never should have come here");
	}

	// If user is logged in, accept the invite
	const [err, result] = await tryCatch(InviteService.acceptInvite(invite, db));

	if (err) {
		return {
			success: false,
			error: err.message,
		};
	}

	redirect(redirectTo);
});

export const rejectInviteAction = defineServerAction(async function rejectInvite({
	inviteToken,
	redirectTo = "/",
}: {
	inviteToken: string;
	redirectTo?: string;
}) {
	const tokenResult = inviteTokenSchema.safeParse(inviteToken);
	if (!tokenResult.success) {
		return {
			success: false,
			error: "Invalid invite token",
		};
	}

	const [err, inviteResult] = await tryCatch(
		InviteService.getValidInviteForLoggedInUser(inviteToken)
	);

	if (err) {
		return {
			success: false,
			error: err.message,
		};
	}

	const { user, invite } = inviteResult;

	if (invite.userId && !user) {
		redirectToLogin({
			redirectTo,
			loginNotice: {
				type: "notice",
				title: "You need to log in in order to reject this invite",
			},
		});
	}

	const [rejectErr, rejectResult] = await tryCatch(InviteService.rejectInvite(invite));

	if (rejectErr) {
		return {
			success: false,
			error: rejectErr.message,
		};
	}

	redirectToLogin({
		loginNotice: {
			type: "notice",
			title: "You have rejected the invite",
		},
	});
});
