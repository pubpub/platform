"use server";

import { logger } from "logger";

import type { action } from "./action";
import { smtpclient } from "~/lib/server/mailgun";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config, pubConfig }) => {
	logger.info({ msg: "email", pub, config, pubConfig });

	

	// query for community?
	const { accepted, rejected } = await smtpclient.sendMail({
		from: "hello@pubpub.org",
		to: config.email,
		replyTo: "hello@pubpub.org",
		html: config.body,
		subject: config.subject,
	});

	return {
		success: true,
		report: "Email sent",
		data: { accepted, rejected },
	};
});
