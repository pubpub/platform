import type { NextRequest } from "next/server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AuthTokenType } from "db/public";

import { lucia } from "~/lib/auth/lucia";
import { InvalidTokenError, validateToken } from "~/lib/server/token";

const redirectToURL = (redirectTo: string, req: NextRequest) => {
	// it's a full url, just redirect them there
	if (URL.canParse(redirectTo)) {
		return NextResponse.redirect(new URL(redirectTo));
	}

	if (URL.canParse(redirectTo, req.url)) {
		return NextResponse.redirect(new URL(redirectTo, req.url));
	}

	// invalid redirectTo, redirect to not-found
	return NextResponse.redirect(new URL(`/not-found?from=${redirectTo}`, req.url));
};

const handleInvalidToken = ({
	redirectTo,
	tokenType,
	req,
}: {
	redirectTo: string;
	tokenType: AuthTokenType | null;
	req: NextRequest;
}) => {
	// for public invites, we want to redirect them to the fill page anyway, even
	// if the token is invalid, as the fill page will redirect them to a page
	// where they can request a new invite
	if (tokenType === AuthTokenType.publicInvite) {
		return redirectToURL(redirectTo, req);
	}

	return NextResponse.redirect(new URL("/not-found", req.url));
};

export async function GET(req: NextRequest) {
	const searchParams = req.nextUrl.searchParams;
	const token = searchParams.get("token");
	const redirectTo = searchParams.get("redirectTo");

	if (!token || !redirectTo) {
		return NextResponse.redirect(new URL("/login", req.url));
	}

	try {
		const { user, authTokenType } = await validateToken(token);

		const session = await lucia.createSession(user.id, {
			type: authTokenType,
		});

		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies().set(sessionCookie.name, sessionCookie.value, {
			...sessionCookie.attributes,
			path: redirectTo,
		});

		return redirectToURL(redirectTo, req);
	} catch (error) {
		if (error instanceof InvalidTokenError) {
			handleInvalidToken({ redirectTo, tokenType: error.tokenType, req });
		}

		return NextResponse.redirect(new URL("/not-found", req.url));
	}
}
