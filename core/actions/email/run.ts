"use server";

import { jsonObjectFrom } from "kysely/helpers/postgres";
import rehypeFormat from "rehype-format";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import type { MembersId } from "db/public";
import { logger } from "logger";
import { expect } from "utils";

import type { action } from "./action";
import { db } from "~/kysely/database";
import { getPubCached } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { smtpclient } from "~/lib/server/mailgun";
import { defineRun } from "../types";
import { EmailDirectivePluginPub, emailDirectives } from "./plugin";

export const run = defineRun<typeof action>(async ({ pub, config, args, communityId }) => {
	try {
		// FIXME: could be replaced with `getCommunitySlug`
		const communitySlug = getCommunitySlug();

		const { parentId } = pub;
		let parentPub: EmailDirectivePluginPub | undefined;

		// TODO: This is a pretty inefficient way of loading the parent pub, as it
		// will redundantly load the child pub. Ideally we would lazily fetch and
		// cache the parent pub while processing the email template.
		if (parentId) {
			parentPub = await getPubCached(parentId);
		}

		// TODO: the pub must currently have an assignee to send an email. This
		// should be set at the action instance level—it should be possible to
		// use the pub assignee, a pub field, a static email address, a member, or
		// a member group as the sender.
		const sender = expect(pub.assignee, "No assignee found for pub");

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
			.where("id", "=", expect(args?.recipient ?? config.recipient) as MembersId)
			.executeTakeFirstOrThrow(
				() =>
					new Error(`Could not find user with ID ${args?.recipient ?? config.recipient}`)
			);

		const emailDirectivesContext = { communitySlug, sender, recipient, pub, parentPub };

		const html = (
			await unified()
				.use(remarkParse)
				.use(remarkDirective)
				.use(emailDirectives, emailDirectivesContext)
				.use(remarkRehype)
				.use(rehypeFormat)
				.use(rehypeStringify)
				.process(args?.body ?? config.body)
		).toString();

		await smtpclient.sendMail({
			from: "hello@pubpub.org",
			to: recipient.user.email,
			replyTo: "hello@pubpub.org",
			html,
			subject: args?.subject ?? config.subject,
		});
	} catch (error) {
		console.log(error);
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
