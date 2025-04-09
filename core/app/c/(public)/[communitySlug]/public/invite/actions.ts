"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import { AuthTokenType } from "db/public";
import { tryCatch } from "utils/try-catch";

import type { SignupFormSchema } from "~/app/components/Signup/schema";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { lucia } from "~/lib/authentication/lucia";
import { createPasswordHash } from "~/lib/authentication/password";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { maybeWithTrx } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { InviteService } from "~/lib/server/invites/InviteService";
import { redirectToCommunitySignup, redirectToLogin } from "~/lib/server/navigation/redirects";
import { addUser, generateUserSlug } from "~/lib/server/user";

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

export const signupThroughInvite = defineServerAction(async function signupThroughInvite(
	inviteToken,
	{
		redirectTo = "/",
		...props
	}: {
		redirectTo?: string;
	} & SignupFormSchema
) {
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

	if (props.email !== invite.email) {
		return {
			success: false,
			error: "Email does not match invite email. You must use the email you were invited with.",
		};
	}

	const [addUserErr, addUserResult] = await tryCatch(
		maybeWithTrx(db, async (trx) => {
			const newUser = await addUser(
				{
					firstName: props.firstName,
					lastName: props.lastName,
					email: props.email,
					slug: generateUserSlug({
						firstName: props.firstName,
						lastName: props.lastName,
					}),
					passwordHash: await createPasswordHash(props.password),
				},
				trx
			).executeTakeFirstOrThrow((err) => {
				Sentry.captureException(err);
				return new Error(
					`Unable to create user for public signup with email ${props.email}`
				);
			});

			const newSession = await lucia.createSession(newUser.id, {
				type: AuthTokenType.generic,
			});
			const newSessionCookie = lucia.createSessionCookie(newSession.id);
			const cookieStore = await cookies();
			cookieStore.set(
				newSessionCookie.name,
				newSessionCookie.value,
				newSessionCookie.attributes
			);

			redirect(redirectTo);
		})
	);

	if (addUserErr) {
		return {
			success: false,
			error: addUserErr.message,
		};
	}

	return {
		success: true,
		report: "Please check your email to verify your account!",
	};
});
