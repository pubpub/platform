"use server";

import rehypeFormat from "rehype-format";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import type { UsersId } from "db/public/Users";
import { logger } from "logger";
import { expect } from "utils";

import type { action } from "./action";
import { db } from "~/kysely/database";
import { smtpclient } from "~/lib/server/mailgun";
import { defineRun } from "../types";
import { emailDirectives } from "./plugin";

export const run = defineRun<typeof action>(async ({ pub, config, args, communityId }) => {
	try {
		// FIXME: could be replaced with `getCommunitySlug`
		const community = await db
			.selectFrom("communities")
			.where("id", "=", communityId)
			.select(["slug"])
			.executeTakeFirstOrThrow();

		// TODO: the pub must currently have an assignee to send an email. This
		// should be set at the action instance level—it should be possible to
		// use the pub assignee, a pub field, a static email address, a member, or
		// a member group as the sender.
		const sender = expect(pub.assignee, "No assignee found for pub");

		// TODO: similar to the assignee, the recipient args/config should accept
		// the pub assignee, a pub field, a static email address, a member, or a
		// member group.
		const recipient = await db
			.selectFrom("users")
			.select(["id", "email", "firstName", "lastName"])
			.where("id", "=", expect(args?.recipient ?? config.recipient) as UsersId)
			.executeTakeFirstOrThrow(
				() =>
					new Error(`Could not find user with ID ${args?.recipient ?? config.recipient}`)
			);

		const emailDirectivesContext = { community, sender, recipient, pub };

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
			to: recipient.email,
			replyTo: "hello@pubpub.org",
			html,
			subject: args?.subject ?? config.subject,
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
