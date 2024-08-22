"use server";

import { CoreSchemaType } from "@prisma/client";
import { jsonObjectFrom } from "kysely/helpers/postgres";

import type { MembersId } from "db/public";
import { logger } from "logger";
import { expect } from "utils";

import type { action } from "./action";
import type { RenderWithPubPub } from "~/lib/server/render/pub/renderWithPubUtils";
import { db } from "~/kysely/database";
import { getPubCached } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { smtpclient } from "~/lib/server/mailgun";
import { renderMarkdownWithPub } from "~/lib/server/render/pub/renderMarkdownWithPub";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config, args, communityId }) => {
	try {
		const communitySlug = getCommunitySlug();

		const { parentId } = pub;
		let parentPub: RenderWithPubPub | undefined;

		// TODO: This is a pretty inefficient way of loading the parent pub, as it
		// will redundantly load the child pub. Ideally we would lazily fetch and
		// cache the parent pub while processing the email template.
		if (parentId) {
			parentPub = await getPubCached(parentId);
		}

		const recipientId = expect(args?.recipient ?? config.recipient) as MembersId;
		const pubMemberFields = await db
			.selectFrom("pub_fields")
			.select(["slug"])
			.where((eb) =>
				eb("slug", "in", Object.keys(pub.values)).and(
					"schemaName",
					"=",
					CoreSchemaType.MemberId as any
				)
			)
			.execute();
		const pubValueMemberIds = pubMemberFields.map(
			(field) => pub.values[field.slug]
		) as MembersId[];
		const userIds: MembersId[] = [recipientId, ...pubValueMemberIds];

		// TODO: similar to the assignee, the recipient args/config should accept
		// the pub assignee, a pub field, a static email address, a member, or a
		// member group.
		const recipient = await db
			.selectFrom("members")
			.select((eb) => [
				"members.id",
				jsonObjectFrom(
					eb
						.selectFrom("users")
						.whereRef("users.id", "=", "members.userId")
						.selectAll("users")
				)
					.$notNull()
					.as("user"),
			])
			.where("id", "=", recipientId)
			.executeTakeFirstOrThrow();

		if (!recipient) {
			throw new Error(`Could not find member with ID ${recipientId}`);
		}

		const renderMarkdownWithPubContext = {
			communitySlug,
			recipient,
			pub,
			parentPub,
		};

		const html = await renderMarkdownWithPub(
			args?.body ?? config.body,
			renderMarkdownWithPubContext
		);
		const subject = await renderMarkdownWithPub(
			args?.subject ?? config.subject,
			renderMarkdownWithPubContext,
			true
		);

		await smtpclient.sendMail({
			from: "hello@pubpub.org",
			to: recipient.user.email,
			replyTo: "hello@pubpub.org",
			html,
			subject,
		});
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
