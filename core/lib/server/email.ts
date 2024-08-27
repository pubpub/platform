import { renderAsync } from "@react-email/render";
import { PasswordReset } from "emails";
import { SendMailOptions } from "nodemailer";

import { AuthTokenType, UsersId } from "db/public";
import { logger } from "logger";

import { createMagicLink } from "~/lib/auth/createMagicLink";
import { smtpclient } from "./mailgun";
import { getUser } from "./user";

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

	public static passwordReset(props: {
		user: {
			id: UsersId;
			email?: string;
			firstName: string;
			lastName?: string | null;
		};
	}) {
		const emailPromise = async () => {
			const user = props.user.email
				? props.user
				: await getUser({ id: props.user.id }).executeTakeFirst();

			if (!user || !user.email) {
				throw new Error(`No user found with id ${props.user.id}`);
			}

			const magicLink = await createMagicLink({
				type: AuthTokenType.passwordReset,
				expiresAt: new Date(Date.now() + FIFTEEN_MINUTES),
				path: "/reset",
				userId: user.id,
			});

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

	public static signup(props: {
		user: {
			id: UsersId;
			email?: string;
			firstName: string;
			lastName?: string | null;
		};
	}) {
		const emailPromise = async () => {
			const user = props.user.email
				? props.user
				: await getUser({ id: props.user.id }).executeTakeFirst();

			if (!user || !user.email) {
				throw new Error(`No user found with id ${props.user.id}`);
			}

			const magicLink = await createMagicLink({
				type: AuthTokenType.passwordReset,
				expiresAt: new Date(Date.now() + FIFTEEN_MINUTES),
				path: "/reset",
				userId: user.id,
			});

			const email = await renderAsync(
				PasswordReset({
					firstName: user.firstName,
				})
			);
		};
	}
}
