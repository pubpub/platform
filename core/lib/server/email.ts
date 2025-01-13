import type { SendMailOptions } from "nodemailer";

import { renderAsync } from "@react-email/render";
import { PasswordReset, RequestLinkToForm, SignupInvite } from "emails";

import type { Communities, MemberRole, Users } from "db/public";
import type { MembershipType } from "db/src/public/MembershipType";
import { AuthTokenType } from "db/public";
import { logger } from "logger";

import type { XOR } from "../types";
import type { FormInviteLinkProps } from "./form";
import { db } from "~/kysely/database";
import { createMagicLink } from "~/lib/authentication/createMagicLink";
import { createFormInviteLink } from "./form";
import { smtpclient } from "./mailgun";

const FIFTEEN_MINUTES = 1000 * 60 * 15;

type RequiredOptions = Required<Pick<SendMailOptions, "to" | "subject">> &
	XOR<{ html: string }, { text: string }>;

export const DEFAULT_OPTIONS = {
	from: `hello@pubpub.org`,
	name: `PubPub Team`,
} as const;

// export class Email {
function buildSend(emailPromise: () => Promise<RequiredOptions>) {
	const func = send.bind(null, emailPromise);

	return {
		send: func as (
			options?: Partial<Omit<SendMailOptions, "to" | "subject" | "html">> & {
				name?: string;
			}
		) => Promise<{ success: true; report?: string } | { error: string }>,
	};
}

async function send(
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
			html: required.html,
			text: required.text,
			...options,
		});

		return {
			success: true,
		};
	} catch (error) {
		logger.error({
			msg: `Failed to send email`,
			error: error.message,
		});
		return {
			error: error.message,
		};
	}
}

export function passwordReset(
	user: Pick<Users, "id" | "email" | "firstName" | "lastName">,
	trx = db
) {
	return buildSend(async () => {
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
			html: email,
			subject: "Reset your PubPub password",
		};
	});
}

function inviteToForm() {
	// TODO:
}

export function signupInvite(
	props: {
		user: Pick<Users, "id" | "email" | "firstName" | "lastName" | "slug">;
		community: Pick<Communities, "name" | "avatar" | "slug">;
		role: MemberRole;
		membership: { type: MembershipType; name: string };
	},
	trx = db
) {
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 7);
	return buildSend(async () => {
		const magicLink = await createMagicLink(
			{
				type: AuthTokenType.signup,
				expiresAt,
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
				membership: props.membership,
			})
		);

		return {
			to: props.user.email,
			html: email,
			subject: "Join PubPub",
		};
	});
}

export function requestAccessToForm(
	props: {
		community: Pick<Communities, "name" | "avatar" | "slug">;
		form: { name: string };
		subject: string;
		to: string | string[];
	} & (FormInviteLinkProps | { formInviteLink: string })
) {
	return buildSend(async () => {
		const inviteLink =
			"formInviteLink" in props ? props.formInviteLink : await createFormInviteLink(props);

		const email = await renderAsync(
			RequestLinkToForm({
				community: props.community,
				formInviteLink: inviteLink,
				form: props.form,
			})
		);

		return {
			to: props.to,
			subject: props.subject,
			html: email,
		};
	});
}

export function generic(opts: RequiredOptions) {
	return buildSend(async () => opts);
}
