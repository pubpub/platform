import type { SendMailOptions } from "nodemailer";

import { render } from "@react-email/render";
import { Invite, PasswordReset, RequestLinkToForm } from "emails";

import type { Communities, MemberRole, MembershipType, Users } from "db/public";
import { AuthTokenType } from "db/public";
import { logger } from "logger";

import type { XOR } from "../types";
import type { FormInviteLinkProps } from "./form";
import { db } from "~/kysely/database";
import { createMagicLink } from "~/lib/authentication/createMagicLink";
import { env } from "../env/env.mjs";
import { createFormInviteLink } from "./form";
import { getSmtpClient } from "./mailgun";

const FIFTEEN_MINUTES = 1000 * 60 * 15;

type RequiredOptions = Required<Pick<SendMailOptions, "to" | "subject">> &
	XOR<{ html: string }, { text: string }>;

export const DEFAULT_OPTIONS = {
	from: env.MAILGUN_SMTP_FROM ?? "hello@pubpub.org",
	name: env.MAILGUN_SMTP_FROM_NAME ?? "PubPub Team",
} as const;

function buildSend(emailPromise: () => Promise<RequiredOptions>) {
	const func = send.bind(null, emailPromise);

	return {
		send: func as (
			options?: Partial<Omit<SendMailOptions, "to" | "subject" | "html">> & {
				name?: string;
			}
		) => Promise<
			{ success: true; report?: string; data: Record<string, unknown> } | { error: string }
		>,
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

		await getSmtpClient().sendMail({
			from: `${options?.name ?? DEFAULT_OPTIONS.name} <${options?.from ?? DEFAULT_OPTIONS.from}>`,
			to: required.to,
			subject: required.subject,
			html: required.html,
			text: required.text,
			...options,
		});

		return {
			success: true,
			report: "Email sent",
			data: {},
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

		const email = await render(
			<PasswordReset
				firstName={user.firstName}
				lastName={user.lastName ?? undefined}
				resetPasswordLink={magicLink}
			/>
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

/**
 * @deprecated use SignupInvite instead
 */
export function _legacy_signupInvite(
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

		const email = await render(
			<Invite
				community={props.community}
				signupLink={magicLink}
				role={props.role}
				membership={props.membership}
			/>
		);

		return {
			to: props.user.email,
			html: email,
			subject: "Join PubPub",
		};
	});
}

export function signupInvite(
	props: {
		community: Pick<Communities, "name" | "avatar" | "slug">;
		user: Pick<Users, "id" | "email" | "firstName" | "lastName" | "slug"> | { email: string };
		inviteLink: string;
	},
	trx = db
) {
	return buildSend(async () => {
		const email = await render(
			<Invite community={props.community} formInviteLink={inviteLink} form={props.form} />
		);
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

		const email = await render(
			<RequestLinkToForm
				community={props.community}
				formInviteLink={inviteLink}
				form={props.form}
			/>
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
