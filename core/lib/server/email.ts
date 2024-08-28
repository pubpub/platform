import type { SendMailOptions } from "nodemailer";

import { renderAsync } from "@react-email/render";
import { PasswordReset, SignupInvite } from "emails";

import type { Communities, MemberRole, Users } from "db/public";
import { AuthTokenType } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { createMagicLink } from "~/lib/auth/createMagicLink";
import { smtpclient } from "./mailgun";

const FIFTEEN_MINUTES = 1000 * 60 * 15;

type RequiredOptions = {
	to: string;
	emailTemplate: string;
	subject: string;
};

const DEFAULT_OPTIONS = {
	from: `hello@pubpub.org`,
	name: `PubPub Team`,
} as const;

export class Email {
	static #buildSend(emailPromise: () => Promise<RequiredOptions>) {
		const func = this.#send.bind(this, emailPromise);

		return func as (
			options?: Partial<Omit<SendMailOptions, "to" | "subject" | "html">> & {
				name?: string;
			}
		) => Promise<{ success: true; report?: string } | { error: string }>;
	}

	static async #send(
		requiredPromise: () => Promise<RequiredOptions>,
		options?: Partial<Omit<SendMailOptions, "to" | "subject" | "html">> & {
			name?: string;
		}
	) {
		try {
			const required = await requiredPromise();

			logger.info({
				msg: `Sending email to ${required.to}`,
				options: {
					...required,
					...options,
				},
			});

			const send = await smtpclient.sendMail({
				from: `${options?.name ?? DEFAULT_OPTIONS.name} <${options?.from ?? DEFAULT_OPTIONS.from}>`,
				to: required.to,
				subject: required.subject,
				html: required.emailTemplate,
				...options,
			});

			return {
				success: true,
			};
		} catch (error) {
			logger.error({
				msg: `Failed to send email`,
				error: error,
			});
			return {
				error: error.message,
			};
		}
	}

	public static passwordReset(
		user: Pick<Users, "id" | "email" | "firstName" | "lastName">,
		trx = db
	) {
		const emailPromise = async () => {
			const magicLink = await createMagicLink(
				{
					type: AuthTokenType.passwordReset,
					expiresAt: new Date(Date.now() + FIFTEEN_MINUTES),
					path: "/reset",
					userId: user.id,
				},
				trx
			);

			const email = await renderAsync(
				PasswordReset({
					firstName: user.firstName,
					lastName: user.lastName ?? undefined,
					resetPasswordLink: magicLink,
				})
			);

			return {
				to: user.email,
				emailTemplate: email,
				subject: "Reset your PubPub password",
			};
		};

		return {
			send: this.#buildSend(emailPromise),
		};
	}

	public static inviteToForm() {
		// TODO:
	}

	public static signupInvite(
		props: {
			user: Pick<Users, "id" | "email" | "firstName" | "lastName" | "slug">;
			community: Pick<Communities, "name" | "avatar" | "slug">;
			role: MemberRole;
		},
		trx = db
	) {
		const emailPromise = async () => {
			const magicLink = await createMagicLink(
				{
					type: AuthTokenType.signup,
					expiresAt: new Date(Date.now() + FIFTEEN_MINUTES),
					path: `/signup?redirectTo=${encodeURIComponent(
						`/c/${props.community.slug}/stages`
					)}`,
					userId: props.user.id,
				},
				trx
			);

			const email = await renderAsync(
				SignupInvite({
					community: props.community,
					signupLink: magicLink,
					role: props.role,
				})
			);

			return {
				to: props.user.email,
				emailTemplate: email,
				subject: "Join PubPub",
			};
		};

		return {
			send: this.#buildSend(emailPromise),
		};
	}
}
