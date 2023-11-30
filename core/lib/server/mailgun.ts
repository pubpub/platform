import nodemailer from "nodemailer";
import { serverEnv } from "~/lib/env/serverEnv";

export const smtpclient = nodemailer.createTransport({
	pool: true,
	host: serverEnv.MAILGUN_SMTP_HOST,
	port: parseInt(serverEnv.MAILGUN_SMTP_PORT),
	secure: serverEnv.MAILGUN_SMTP_HOST !== "localhost",
	auth: {
		user: serverEnv.MAILGUN_SMTP_USERNAME,
		pass: serverEnv.MAILGUN_SMTP_PASSWORD,
	},
});
