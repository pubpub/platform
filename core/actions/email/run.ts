"use server";

import { logger } from "logger";

import type { action } from "./action";
import { smtpclient } from "~/lib/server/mailgun";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config, pubConfig }) => {
	try {
		await smtpclient.sendMail({
			from: "hello@pubpub.org",
			to: config.email,
			replyTo: "hello@pubpub.org",
			html: config.body,
			subject: config.subject,
		});
	} catch (error) {
		logger.error({ msg: "email", error });
		return {
			title: "Failed to Send Email",
			error: "An error occured while sending the email",
			cause: error,
		};
	}

	logger.info({ msg: "email", pub, config, pubConfig });

	return {
		success: true,
		report: "Email sent",
		data: {},
	};
});
