import * as Sentry from "@sentry/nextjs";

import { logger } from "logger";

export const SIGNUP_ERRORS = [
	"NOT_LOGGED_IN",
	"ALREADY_MEMBER",
	"NOT_ALLOWED",
	"COMMUNITY_NOT_FOUND",
	"EMAIL_ALREADY_EXISTS",
] as const;
export type SIGNUP_ERROR = (typeof SIGNUP_ERRORS)[number];

export const createAndLogError = <T extends SIGNUP_ERROR>(
	error: T,
	message: string,
	captureInSentry = false
) => {
	logger.debug({
		msg: "Signup error",
		error,
		message,
	});
	if (captureInSentry) {
		Sentry.captureException(new Error(message));
	}

	return {
		type: error,
		error: message,
	};
};

export const SignupErrors = {
	NOT_LOGGED_IN: (props: { communityName: string }) =>
		createAndLogError("NOT_LOGGED_IN", `You must be logged in to join ${props.communityName}`),
	ALREADY_MEMBER: (props: { communityName: string }) =>
		createAndLogError("ALREADY_MEMBER", `You are already a member of ${props.communityName}`),
	NOT_ALLOWED: (props: { communityName: string }) =>
		createAndLogError(
			"NOT_ALLOWED",
			`Public signups are not allowed for ${props.communityName}`
		),
	COMMUNITY_NOT_FOUND: (props: { communityName: string }) =>
		createAndLogError("COMMUNITY_NOT_FOUND", `Community not found`),
	EMAIL_ALREADY_EXISTS: (props: { email: string }) =>
		createAndLogError("EMAIL_ALREADY_EXISTS", `Email ${props.email} is already taken`),
} as const satisfies {
	[E in SIGNUP_ERROR]:
		| ((props: { communityName: string }) => {
				type: E;
				error: string;
		  })
		| ((props: { email: string }) => {
				type: E;
				error: string;
		  });
};
