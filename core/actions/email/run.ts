"use server";

import { jsonObjectFrom } from "kysely/helpers/postgres";

import type { CommunityMembershipsId } from "db/public";
import { logger } from "logger";
import { assert, expect } from "utils";

import type { action } from "./action";
import type { RenderWithPubContext } from "~/lib/server/render/pub/renderWithPubUtils";
import { db } from "~/kysely/database";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import * as Email from "~/lib/server/email";
import { renderMarkdownWithPub } from "~/lib/server/render/pub/renderMarkdownWithPub";
import { isClientException } from "~/lib/serverActions";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config, args, communityId }) => {
	try {
		const communitySlug = await getCommunitySlug();
		const recipientEmail = args?.recipientEmail ?? config.recipientEmail;
		const recipientMemberId = (args?.recipientMember ?? config.recipientMember) as
			| CommunityMembershipsId
			| undefined;

		assert(
			recipientEmail !== undefined || recipientMemberId !== undefined,
			"No email recipient was specified"
		);

		let recipient: RenderWithPubContext["recipient"] | undefined;

		if (recipientMemberId !== undefined) {
			recipient = await db
				.selectFrom("community_memberships")
				.select((eb) => [
					"community_memberships.id",
					jsonObjectFrom(
						eb
							.selectFrom("users")
							.whereRef("users.id", "=", "community_memberships.userId")
							.selectAll("users")
					)
						.$notNull()
						.as("user"),
				])
				.where("id", "=", recipientMemberId)
				.executeTakeFirstOrThrow(
					() => new Error(`Could not find member with ID ${recipientMemberId}`)
				);
		} else {
			recipient = {
				email: expect(recipientEmail),
			};
		}

		const renderMarkdownWithPubContext = {
			communityId,
			communitySlug,
			recipient,
			pub,
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
			to: expect(recipient?.user?.email ?? recipientEmail),
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
	} catch (error) {
		logger.error({ msg: "Failed to send email", error });

		return {
			title: "Failed to Send Email",
			error: error.message,
			cause: error,
		};
	}
});
