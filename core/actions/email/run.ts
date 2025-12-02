"use server"

import type { Database } from "db/Database"
import type { CommunitiesId, CommunityMembershipsId } from "db/public"
import type { Kysely } from "kysely"
import type { RenderWithPubContext } from "~/lib/server/render/pub/renderWithPubUtils"
import type { action } from "./action"

import { logger } from "logger"
import { assert, expect } from "utils"

import { db } from "~/kysely/database"
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug"
import * as Email from "~/lib/server/email"
import { maybeWithTrx } from "~/lib/server/maybeWithTrx"
import { coalesceMemberships, selectCommunityMemberships } from "~/lib/server/member"
import { renderMarkdownWithPub } from "~/lib/server/render/pub/renderMarkdownWithPub"
import { getUser } from "~/lib/server/user"
import { isClientException } from "~/lib/serverActions"
import { defineRun } from "../types"

const resolveRecipient = async (
	recipientEmail: string | undefined,
	recipientMemberId: CommunityMembershipsId | undefined,
	communityId: CommunitiesId,
	trx: Kysely<Database>
): Promise<NonNullable<RenderWithPubContext["recipient"]>> => {
	if (recipientMemberId !== undefined) {
		const memberships = await selectCommunityMemberships({
			id: recipientMemberId,
		}).execute()
		if (!memberships.length) {
			throw new Error(`Could not find member with ID ${recipientMemberId}`)
		}

		const membership = coalesceMemberships(memberships)

		return {
			id: membership.id,
			user: membership.user,
		}
	}

	if (!recipientEmail) {
		throw new Error("No recipient was specified")
	}

	// check if user exists
	const user = await getUser({ email: recipientEmail }, trx).executeTakeFirst()

	// this email is not associated with a user
	if (!user) {
		return {
			email: recipientEmail,
		}
	}

	// check if that user is a member of the community then
	const memberships = await selectCommunityMemberships({
		userId: user.id,
		communityId,
	}).execute()

	if (!memberships.length) {
		// we send an invite
		return {
			email: recipientEmail,
		}
	}

	// we send the email to the user
	const membership = coalesceMemberships(memberships)
	return {
		id: membership.id,
		user: membership.user,
	}
}

export const run = defineRun<typeof action>(
	async ({ pub, config, communityId, actionRunId, userId }) => {
		try {
			const result = await maybeWithTrx(db, async (trx) => {
				const communitySlug = await getCommunitySlug()
				const recipientEmail = config.recipientEmail
				const recipientMemberId = config.recipientMember as
					| CommunityMembershipsId
					| undefined

				assert(
					recipientEmail !== undefined || recipientMemberId !== undefined,
					"No recipient was specified for email"
				)

				const recipient = await resolveRecipient(
					recipientEmail,
					recipientMemberId,
					communityId,
					trx
				)

				const renderMarkdownWithPubContext = {
					communityId,
					communitySlug,
					recipient,
					pub,
					inviter: {
						userId,
						actionRunId,
					},
					trx,
				} as RenderWithPubContext

				const html = await renderMarkdownWithPub(config.body, renderMarkdownWithPubContext)
				const subject = await renderMarkdownWithPub(
					config.subject,
					renderMarkdownWithPubContext,
					true
				)

				const result = await Email.generic({
					to: expect(recipient.email ?? recipient.user.email),
					subject,
					html,
				}).send({
					name: config.senderName,
					replyTo: config.replyTo,
				})

				if (isClientException(result)) {
					logger.error({
						msg: "An error occurred while sending an email",
						error: result.error,
						pub,
						config,
						renderMarkdownWithPubContext,
					})
				} else {
					logger.info({
						msg: "Successfully sent email",
						pub,
						config,
						renderMarkdownWithPubContext,
					})
				}

				return result
			})
			return result
		} catch (error) {
			logger.error({ msg: "Failed to send email", error })

			return {
				success: false,
				title: "Failed to Send Email",
				error: error.message,
				cause: error,
			}
		}
	}
)
