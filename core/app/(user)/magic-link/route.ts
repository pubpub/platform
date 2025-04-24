import type { NextRequest } from "next/server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { AuthTokenType } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { lucia } from "~/lib/authentication/lucia";
import { createRedirectUrl } from "~/lib/redirect";
import { redirectToLogin } from "~/lib/server/navigation/redirects";
import { InvalidTokenError, TokenFailureReason, validateToken } from "~/lib/server/token";

const redirectToURL = (
	redirectTo: string,
	opts?: ResponseInit & {
		searchParams?: Record<string, string>;
	}
) => {
	const url = createRedirectUrl(redirectTo, opts?.searchParams);
	return NextResponse.redirect(url, opts);
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

const handleTokenFlow = async (token: string, redirectTo: string, req: NextRequest) => {
	const validatedTokenPromise = validateToken(token);

	const currentSessionCookie = (await cookies()).get(lucia.sessionCookieName)?.value;

	const currentSessionPromise = currentSessionCookie
		? lucia.validateSession(currentSessionCookie)
		: { user: null, session: null };

	const [tokenSettled, sessionSettled] = await Promise.allSettled([
		validatedTokenPromise,
		currentSessionPromise,
	]);

	if (tokenSettled.status === "rejected") {
		logger.debug({ msg: "Token validation failed", reason: tokenSettled.reason });

		if (tokenSettled.reason instanceof InvalidTokenError) {
			return handleInvalidToken({
				redirectTo,
				tokenType: tokenSettled.reason.tokenType,
				reason: tokenSettled.reason.reason,
				token,
			});
		}

		logger.error({
			msg: `Token validation unexpectedly failed with reason: ${tokenSettled.reason}`,
			reason: tokenSettled.reason,
		});

		throw tokenSettled.reason;
	}

	const currentSession =
		sessionSettled.status === "fulfilled"
			? sessionSettled.value
			: { user: null, session: null };

	if (currentSession.session) {
		logger.debug("Invalidating old session");
		await lucia.invalidateSession(currentSession.session.id);
		// not sure if this is necessary
		(await cookies()).delete(lucia.sessionCookieName);
	}

	const { user: tokenUser, authTokenType } = tokenSettled.value;

	if (!tokenUser.isVerified) {
		await db
			.updateTable("users")
			.set({ isVerified: true })
			.where("id", "=", tokenUser.id)
			.execute();
	}

	const session = await lucia.createSession(tokenUser.id, {
		type: authTokenType,
	});

	const newSessionCookie = lucia.createSessionCookie(session.id);

	(await cookies()).set(newSessionCookie.name, newSessionCookie.value, {
		...newSessionCookie.attributes,
	});

	return redirectToURL(redirectTo, req);
};

export async function GET(req: NextRequest) {
	const searchParams = req.nextUrl.searchParams;
	const token = searchParams.get("token");
	const redirectTo = searchParams.get("redirectTo");

	if (!redirectTo) {
		logger.error({
			msg: "Magic link did not contain a redirectTo",
			url: req.nextUrl,
			cookies: req.cookies.getAll(),
		});
		return redirectToLogin({
			loginNotice: {
				type: "error",
				title: "Your magic link is invalid",
			},
		});
	}

	if (token) {
		return handleTokenFlow(token, redirectTo, req);
	}

	logger.error({
		msg: "Magic link did not contain a token",
		url: req.nextUrl,
		cookies: req.cookies.getAll(),
	});

	return redirectToLogin({
		loginNotice: {
			type: "error",
			title: "Your magic link is invalid",
			// maybe to expressive to users
			body: "You magic link did not contain a magic link token.",
		},
	});
}
