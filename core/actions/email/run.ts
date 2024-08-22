"use server";

import { jsonObjectFrom } from "kysely/helpers/postgres";
import rehypeFormat from "rehype-format";
import rehypeRemark from "rehype-remark";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

import type { MembersId } from "db/public";
import { logger } from "logger";
import { expect } from "utils";

import type { action } from "./action";
import type { EmailDirectivePluginPub } from "./plugin";
import { db } from "~/kysely/database";
import { getPubCached } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { smtpclient } from "~/lib/server/mailgun";
import { defineRun } from "../types";
import { emailDirectives } from "./plugin";

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
					new Error(
						`Could not find member with ID ${args?.recipient ?? config.recipient}`
					)
			);

		const emailDirectivesContext = { communitySlug, recipient, pub, parentPub };

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

		const subject = (
			await unified()
				.use(remarkParse)
				.use(remarkDirective)
				.use(emailDirectives, emailDirectivesContext)
				.use(remarkRehype)
				.use(rehypeFormat)
				.use(rehypeRemark)
				.use(remarkStringify)
				.process(args?.subject ?? config.subject)
		)
			.toString()
			.trim();

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
