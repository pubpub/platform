"use server";

import { Marked } from "marked";
import { createDirectives } from "marked-directive";

import { logger } from "logger";
import { assert, expect, isAssertionError } from "utils";

import type { action } from "./action";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { smtpclient } from "~/lib/server/mailgun";
import { createToken } from "~/lib/server/token";
import { defineRun } from "../types";
import { directiveUsesAuth, formLink, isDirective, isValidEmailDirective } from "./directives";

const INVALID_EMAIL_DIRECTIVE_ERROR = "Invalid email directive";

export const run = defineRun<typeof action>(async ({ pub, config, args, communityId }) => {
	const community = await db
		.selectFrom("communities")
		.where("id", "=", communityId)
		.select(["slug"])
		.executeTakeFirstOrThrow();
	// The user should be already authenticated by `runServerAction` at this point.
	const user = expect(await getLoginData());
	const emailContext = { community };
	const emailDirectives = createDirectives([formLink(emailContext)]);
	try {
		const html = await new Marked().use(emailDirectives).parse(config.body, {
			async: true,
			async walkTokens(token) {
				// For directive tokens
				if (isDirective(token)) {
					// Assert they are defined, valid tokens
					assert(isValidEmailDirective(token), INVALID_EMAIL_DIRECTIVE_ERROR);
					// If the directive uses auth, attach an auth token to the marked token
					// for use in the directive's renderer (e.g. in a link).
					if (directiveUsesAuth(token)) {
						token.auth = await createToken(user.id);
					}
				}
			},
		});
		await smtpclient.sendMail({
			from: "hello@pubpub.org",
			to: config.email,
			replyTo: "hello@pubpub.org",
			html,
			subject: config.subject,
		});
	} catch (error) {
		logger.error({ msg: "email", error });
		if (isAssertionError(error) && error.message.includes(INVALID_EMAIL_DIRECTIVE_ERROR)) {
			return {
				title: "Failed to Send Email",
				error: error.message,
				cause: error,
			};
		}
		return {
			title: "Failed to Send Email",
			error: "An error occured while sending the email",
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
