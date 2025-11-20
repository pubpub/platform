import type SMTPPool from "nodemailer/lib/smtp-pool"

import nodemailer from "nodemailer"

import { env } from "~/lib/env/env"

let smtpclient: nodemailer.Transporter

const TLS_CONFIG = {
	secure: false,
	opportunisticTLS: true,
	tls: {
		ciphers: "SSLv3",
		rejectUnauthorized: false,
	},
} as const satisfies Partial<SMTPPool.Options>

const SSL_CONFIG = {
	secure: true,
} as const satisfies Partial<SMTPPool.Options>

const NO_CONFIG = {
	secure: false,
	opportunisticTLS: true,
} as const satisfies Partial<SMTPPool.Options>

const guessSecurityType = () => {
	if (env.MAILGUN_SMTP_PORT === "465") {
		return "ssl"
	}

	if (env.MAILGUN_SMTP_PORT === "587") {
		return "tls"
	}

	return "none"
}

const getSecurityConfig = () => {
	const securityType = env.MAILGUN_SMTP_SECURITY ?? guessSecurityType()

	if (securityType === "ssl") {
		return SSL_CONFIG
	}

	if (securityType === "tls") {
		return TLS_CONFIG
	}

	return NO_CONFIG
}

export const getSmtpClient = () => {
	const securityConfig = getSecurityConfig()

	if (
		!env.MAILGUN_SMTP_HOST ||
		!env.MAILGUN_SMTP_PORT ||
		!env.MAILGUN_SMTP_USERNAME ||
		!env.MAILGUN_SMTP_PASSWORD
	) {
		throw new Error(
			"Missing required SMTP configuration. Please set MAILGUN_SMTP_HOST, MAILGUN_SMTP_PORT, MAILGUN_SMTP_USERNAME, and MAILGUN_SMTP_PASSWORD in order to send emails."
		)
	}

	if (!smtpclient) {
		smtpclient = nodemailer.createTransport({
			...securityConfig,
			pool: true,
			host: env.MAILGUN_SMTP_HOST,
			port: parseInt(env.MAILGUN_SMTP_PORT, 10),
			secure: securityConfig.secure && env.MAILGUN_SMTP_HOST !== "localhost" && !env.CI,
			auth: {
				user: env.MAILGUN_SMTP_USERNAME,
				pass: env.MAILGUN_SMTP_PASSWORD,
			},
		})
	}

	return smtpclient
}
