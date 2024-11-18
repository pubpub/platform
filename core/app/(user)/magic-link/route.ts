import type { NextRequest } from "next/server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { AuthTokenType } from "db/public";
import { logger } from "logger";

import { lucia } from "~/lib/authentication/lucia";
import { env } from "~/lib/env/env.mjs";
import { InvalidTokenError, TokenFailureReason, validateToken } from "~/lib/server/token";

const redirectToURL = (
	redirectTo: string,
	opts?: ResponseInit & {
		searchParams?: Record<string, string>;
	}
) => {
	// it's a full url, just redirect them there
	if (URL.canParse(redirectTo)) {
		const url = new URL(redirectTo);
		Object.entries(opts?.searchParams ?? {}).forEach(([key, value]) => {
			url.searchParams.append(key, value);
		});

		return NextResponse.redirect(url, opts);
	}

	if (URL.canParse(redirectTo, env.PUBPUB_URL)) {
		const url = new URL(redirectTo, env.PUBPUB_URL);

		Object.entries(opts?.searchParams ?? {}).forEach(([key, value]) => {
			url.searchParams.append(key, value);
		});
		return NextResponse.redirect(url, opts);
	}

	// invalid redirectTo, redirect to not-found
	return NextResponse.redirect(
		new URL(`/not-found?from=${encodeURIComponent(redirectTo)}`, env.PUBPUB_URL),
		opts
	);
};

/**
 * if the token is expired, we redirect them to the page anyway and
 * attach the token so the page can do custom token logic if it needs to
 *
 * otherwise, they get redirected to the invalid token page
 */
const handleInvalidToken = ({
	redirectTo,
	tokenType,
	reason,
	token,
}: {
	redirectTo: string;
	tokenType: AuthTokenType | null;
	reason: TokenFailureReason;
	token: string;
}) => {
	if (reason === TokenFailureReason.expired) {
		// if the token is expired, we just send you through and let the page handle it
		// we attach the token so the page can do custom token logic if it needs to
		return redirectToURL(redirectTo, {
			searchParams: {
				token,
				reason,
			},
		});
	}

	// TODO: may want to add additional error pages for specific reasons
	return redirectToURL(`/invalid-token?redirectTo=${encodeURIComponent(redirectTo)}`);
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
		logger.debug({ msg: "Token validation failed", reason: tokenSettled.reason });
		if (!(tokenSettled.reason instanceof InvalidTokenError)) {
			logger.error({
				msg: `Token validation unexpectedly failed with reason: ${tokenSettled.reason}`,
				reason: tokenSettled.reason,
			});

			throw tokenSettled.reason;
		}

		return handleInvalidToken({
			redirectTo,
			tokenType: tokenSettled.reason.tokenType,
			reason: tokenSettled.reason.reason,
			token,
		});
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
