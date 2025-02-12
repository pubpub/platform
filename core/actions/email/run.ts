"use server";

import { jsonObjectFrom } from "kysely/helpers/postgres";

import type { CommunityMembershipsId } from "db/public";
import { logger } from "logger";
import { assert, expect } from "utils";

import type { action } from "./action";
import type {
	RenderWithPubContext,
	RenderWithPubPub,
} from "~/lib/server/render/pub/renderWithPubUtils";
import { db } from "~/kysely/database";
import { getPubsWithRelatedValuesAndChildren } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import * as Email from "~/lib/server/email";
import { renderMarkdownWithPub } from "~/lib/server/render/pub/renderMarkdownWithPub";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config, args, communityId }) => {
	try {
		const communitySlug = await getCommunitySlug();

		const { parentId } = pub;
		let parentPub: RenderWithPubPub | undefined;

		// TODO: This is a pretty inefficient way of loading the parent pub, as it
		// will redundantly load the child pub. Ideally we would lazily fetch and
		// cache the parent pub while processing the email template.
		if (parentId) {
			parentPub = await getPubsWithRelatedValuesAndChildren(
				{ pubId: parentId, communityId },
				{
					withPubType: true,
					withStage: true,
				}
			);
		}

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
		}

		const renderMarkdownWithPubContext = {
			communityId,
			communitySlug,
			recipient,
			pub,
			parentPub,
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
			to: expect(recipient?.user.email ?? recipientEmail),
			subject,
			html,
		}).send();

		return result;
	} catch (error) {
		logger.error({ msg: "email", error });

		return {
			title: "Failed to Send Email",
			error: error.message,
			cause: error,
		};
	}

	logger.info({ msg: "email", pub, config, args });

	return {
		success: true,
		report: "Email sent",
		data: {},
	};
});
