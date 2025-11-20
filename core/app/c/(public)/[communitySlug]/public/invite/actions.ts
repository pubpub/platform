"use server"

import type { SignupFormSchema } from "~/app/components/Signup/schema"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { AuthTokenType, InviteStatus } from "db/public"
import { tryCatch } from "utils/try-catch"

import { db } from "~/kysely/database"
import { lucia } from "~/lib/authentication/lucia"
import { createLastModifiedBy } from "~/lib/lastModifiedBy"
import { findCommunityBySlug } from "~/lib/server/community"
import { defineServerAction } from "~/lib/server/defineServerAction"
import { InviteService } from "~/lib/server/invites/InviteService"
import { maybeWithTrx } from "~/lib/server/maybeWithTrx"
import { redirectToCommunitySignup, redirectToLogin } from "~/lib/server/navigation/redirects"
import { setUserPassword, updateUser } from "~/lib/server/user"

// Schema for the invite token
const inviteTokenSchema = z.string().min(1)

export const acceptInviteAction = defineServerAction(async function acceptInvite({
	inviteToken,
	redirectTo,
}: {
	inviteToken: string
	redirectTo: string
}) {
	const tokenResult = inviteTokenSchema.safeParse(inviteToken)
	if (!tokenResult.success) {
		return {
			success: false,
			error: "Invalid invite token",
		}
	}

	const community = await findCommunityBySlug()

	if (!community) {
		return {
			success: false,
			error: "Community not found",
		}
	}

	const { invite, user } = await InviteService.getValidInviteForLoggedInUser(inviteToken)

	if (!user) {
		if (!invite.user.isProvisional) {
			// redirect to login, then back to invite, then to the correct page
			const inviteUrl = await InviteService.createInviteLink(invite, {
				redirectTo,
				absolute: false,
			})

			redirectToLogin({
				redirectTo: inviteUrl,
				loginNotice: {
					type: "notice",
					title: "You need to log in in order to accept this invite",
				},
			})
			throw new Error("User invite")
		}

		// If user is not logged in, create a signup link and redirect to it
		// we do mark the invite as accepted, but not completed
		await InviteService.setInviteStatus(
			invite,
			InviteStatus.accepted,
			createLastModifiedBy({ userId: invite.userId }),
			db
		)

		await redirectToCommunitySignup({
			redirectTo,
			inviteToken,
			notice: {
				type: "notice",
				title: "You need to create an account in order to accept this invite",
			},
		})
		throw new Error("Never should have come here")
	}

	// If user is logged in, accept the invite
	const [err, _result] = await tryCatch(InviteService.completeInvite(invite, db))

	if (err) {
		return {
			success: false,
			error: err.message,
		}
	}

	redirect(redirectTo)
})

export const rejectInviteAction = defineServerAction(async function rejectInvite({
	inviteToken,
	redirectTo = "/",
}: {
	inviteToken: string
	redirectTo?: string
}) {
	const tokenResult = inviteTokenSchema.safeParse(inviteToken)
	if (!tokenResult.success) {
		return {
			success: false,
			error: "Invalid invite token",
		}
	}

	const [err, inviteResult] = await tryCatch(
		InviteService.getValidInviteForLoggedInUser(inviteToken)
	)

	if (err) {
		return {
			success: false,
			error: err.message,
		}
	}

	const { user, invite } = inviteResult

	const [rejectErr, _rejectResult] = await tryCatch(InviteService.rejectInvite(invite))

	if (rejectErr) {
		return {
			success: false,
			error: rejectErr.message,
		}
	}

	redirectToLogin({
		loginNotice: {
			type: "notice",
			title: "You have rejected the invite",
		},
	})
})

export const signupThroughInvite = defineServerAction(async function signupThroughInvite(
	inviteToken,
	{
		redirectTo = "/",
		...props
	}: {
		redirectTo?: string
	} & SignupFormSchema
) {
	const [err, inviteResult] = await tryCatch(
		InviteService.getValidInviteForLoggedInUser(inviteToken)
	)

	if (err) {
		return {
			success: false,
			error: err.message,
		}
	}

	const { user, invite } = inviteResult

	if (props.email !== invite.user.email) {
		return {
			success: false,
			error: "Email does not match invite email. You must use the email you were invited with.",
		}
	}

	const [addUserErr, newUser] = await tryCatch(
		maybeWithTrx(db, async (trx) => {
			const newUser = await updateUser(
				{
					firstName: props.firstName,
					lastName: props.lastName,
					id: invite.user.id,
					isProvisional: false,
					isVerified: true,
				},
				trx
			)

			await setUserPassword(
				{
					userId: newUser.id,
					password: props.password,
				},
				trx
			)

			await InviteService.completeInvite(invite, trx, newUser)

			return newUser
		})
	)

	if (addUserErr && addUserErr instanceof InviteService.InviteError) {
		return {
			success: false,
			error: addUserErr.message,
		}
	}

	if (addUserErr) {
		throw addUserErr
	}

	const newSession = await lucia.createSession(newUser.id, {
		type: AuthTokenType.generic,
	})
	const newSessionCookie = lucia.createSessionCookie(newSession.id)
	const cookieStore = await cookies()
	cookieStore.set(newSessionCookie.name, newSessionCookie.value, newSessionCookie.attributes)

	redirect(redirectTo)

	return {
		success: true,
		report: "Please check your email to verify your account!",
	}
})
