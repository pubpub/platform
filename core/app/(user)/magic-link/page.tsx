import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { lucia } from "~/lib/auth/lucia";
import { validateToken } from "~/lib/server/token";

export default async function MagicLinkPage({
	searchParams: { token, redirectTo },
}: {
	searchParams: {
		token: string;
		redirectTo: string;
	};
}) {
	if (!token || !redirectTo) {
		return "Invalid";
	}

	const valid = await validateToken(token);

	if (!valid) {
		notFound();
	}

	const session = await lucia.createSession(valid.userId, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

	redirect(redirectTo);
}
