import type { NextRequest } from "next/server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AuthTokenType } from "db/public";

import { lucia } from "~/lib/auth/lucia";
import { env } from "~/lib/env/env.mjs";
import { validateToken } from "~/lib/server/token";

export async function GET(req: NextRequest) {
	const searchParams = req.nextUrl.searchParams;
	const token = searchParams.get("token");
	const redirectTo = searchParams.get("redirectTo");

	if (!token || !redirectTo) {
		return NextResponse.redirect(new URL("/login", req.url));
	}

	const user = await validateToken(token, AuthTokenType.passwordReset);

	if (!user) {
		return NextResponse.redirect(new URL("/not-found"));
	}

	const session = await lucia.createSession(user.id, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	cookies().set(sessionCookie.name, sessionCookie.value, {
		...sessionCookie.attributes,
		path: redirectTo,
	});

	return NextResponse.redirect(new URL(`${env.NEXT_PUBLIC_PUBPUB_URL}${redirectTo}`));
}
