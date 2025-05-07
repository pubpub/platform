"use server";

import type { CommunityMembershipsId } from "db/public";
import { logger } from "logger";
import { assert, expect } from "utils";

import type { action } from "./action";
import type { RenderWithPubContext } from "~/lib/server/render/pub/renderWithPubUtils";
import { db } from "~/kysely/database";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import * as Email from "~/lib/server/email";
import { maybeWithTrx } from "~/lib/server/maybeWithTrx";
import { coalesceMemberships, selectCommunityMemberships } from "~/lib/server/member";
import { renderMarkdownWithPub } from "~/lib/server/render/pub/renderMarkdownWithPub";
import { isClientException } from "~/lib/serverActions";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(
	async ({ pub, config, args, communityId, actionRunId, userId }) => {
		try {
			const result = await maybeWithTrx(db, async (trx) => {
				const communitySlug = await getCommunitySlug();
				const recipientEmail = args?.recipientEmail ?? config.recipientEmail;
				const recipientMemberId = (args?.recipientMember ?? config.recipientMember) as
					| CommunityMembershipsId
					| undefined;

				assert(
					recipientEmail !== undefined || recipientMemberId !== undefined,
					"No recipient was specified for email"
				);

				let recipient: RenderWithPubContext["recipient"] | undefined;

				if (recipientMemberId !== undefined) {
					const memberships = await selectCommunityMemberships({
						id: recipientMemberId,
					}).execute();
					if (!memberships.length) {
						throw new Error(`Could not find member with ID ${recipientMemberId}`);
					}

					const membership = coalesceMemberships(memberships);

					recipient = {
						id: membership.id,
						user: membership.user,
					};
				} else if (recipientEmail !== undefined) {
					recipient = {
						email: recipientEmail,
					};
				} else {
					throw new Error("No recipient was specified");
				}

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
				} as RenderWithPubContext;

				const html = await renderMarkdownWithPub(
					args?.body ?? config.body,
					renderMarkdownWithPubContext
				);
				const subject = await renderMarkdownWithPub(
					args?.subject ?? config.subject,
					renderMarkdownWithPubContext,
					true
				);

				const result = await Email.generic({
					to: expect(recipient.email ?? recipient.user.email),
					subject,
					html,
				}).send();

				if (isClientException(result)) {
					logger.error({
						msg: "An error occurred while sending an email",
						error: result.error,
						pub,
						config,
						args,
						renderMarkdownWithPubContext,
					});
				} else {
					logger.info({
						msg: "Successfully sent email",
						pub,
						config,
						args,
						renderMarkdownWithPubContext,
					});
				}

				return result;
			});
			return result;
		} catch (error) {
			logger.error({ msg: "Failed to send email", error });

			return {
				title: "Failed to Send Email",
				error: error.message,
				cause: error,
			};
		}
	}
);
