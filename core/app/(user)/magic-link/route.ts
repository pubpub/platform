import type { NextRequest } from "next/server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { AuthTokenType } from "db/public";
import { logger } from "logger";

import {
	AuthFailureReason,
	PUBPUB_AUTH_FAILURE_HEADER,
} from "~/lib/auth/helpers/authFailureReason";
import { lucia } from "~/lib/auth/lucia";
import { InvalidTokenError, validateToken } from "~/lib/server/token";

const redirectToURL = (redirectTo: string, req: NextRequest, opts?: ResponseInit) => {
	// it's a full url, just redirect them there
	if (URL.canParse(redirectTo)) {
		return NextResponse.redirect(new URL(redirectTo), opts);
	}

	if (URL.canParse(redirectTo, req.url)) {
		return NextResponse.redirect(new URL(redirectTo, req.url), opts);
	}

	// invalid redirectTo, redirect to not-found
	return NextResponse.redirect(new URL(`/not-found?from=${redirectTo}`, req.url), opts);
};

/**
 *
 * just redirect them to the page they were trying to access,
 * pages should handle auth failures themselves anyway
 *
 * we do let them know that the reason for the failure is invalid token
 * that way pages can distinguish between an invalid token redirect and just accessing the page
 * without being logged in
 */
const handleInvalidToken = ({
	redirectTo,
	tokenType,
	req,
}: {
	redirectTo: string;
	tokenType: AuthTokenType | null;
	req: NextRequest;
}) => {
	return redirectToURL(redirectTo, req, {
		headers: {
			[PUBPUB_AUTH_FAILURE_HEADER]: AuthFailureReason.InvalidToken,
		},
	});
};

export async function GET(req: NextRequest) {
	const searchParams = req.nextUrl.searchParams;
	const token = searchParams.get("token");
	const redirectTo = searchParams.get("redirectTo");

	if (!token || !redirectTo) {
		return NextResponse.redirect(new URL("/login", req.url));
	}

	const validatedTokenPromise = validateToken(token);

	const currentSessionCookie = cookies().get(lucia.sessionCookieName)?.value;

	const currentSessionPromise = currentSessionCookie
		? lucia.validateSession(currentSessionCookie)
		: { user: null, session: null };

	const [tokenSettled, sessionSettled] = await Promise.allSettled([
		validatedTokenPromise,
		currentSessionPromise,
	]);

	if (tokenSettled.status === "rejected") {
		logger.debug("Token validation failed");
		if (!(tokenSettled.reason instanceof InvalidTokenError)) {
			logger.error({
				msg: `Token validation unexpectedly failed with reason: ${tokenSettled.reason}`,
				reason: tokenSettled.reason,
			});

			throw tokenSettled.reason;
		}

		return handleInvalidToken({ redirectTo, tokenType: tokenSettled.reason.tokenType, req });
	}

	const currentSession =
		sessionSettled.status === "fulfilled"
			? sessionSettled.value
			: { user: null, session: null };

	if (currentSession.session) {
		logger.debug("Invalidating old session");
		await lucia.invalidateSession(currentSession.session.id);
		// not sure if this is necessary
		cookies().delete(lucia.sessionCookieName);
	}

	const { user: tokenUser, authTokenType } = tokenSettled.value;

	const session = await lucia.createSession(tokenUser.id, {
		type: authTokenType,
	});

	const newSessionCookie = lucia.createSessionCookie(session.id);

	cookies().set(newSessionCookie.name, newSessionCookie.value, {
		...newSessionCookie.attributes,
	});

	return redirectToURL(redirectTo, req);
}
