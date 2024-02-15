import nodemailer from "nodemailer";
import { env } from "~/lib/env/env.mjs";}

export const smtpclient = nodemailer.createTransport({
	pool: true,
	host: env.MAILGUN_SMTP_HOST,
	port: parseInt(env.MAILGUN_SMTP_PORT),
	secure: env.MAILGUN_SMTP_HOST !== "localhost",
	auth: {
		user: env.MAILGUN_SMTP_USERNAME,
		pass: env.MAILGUN_SMTP_PASSWORD,
	},
});
