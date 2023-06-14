import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import prisma from "prisma/db";
import { REFRESH_NAME, TOKEN_NAME } from "lib/auth/cookies";
import { getIdFromJWT } from "lib/auth/loginId";

/* This is only called from Server Component functions */
/* When in the API, use getLoginId from loginId.ts */
export const getLoginData = cache(async () => {
	const nextCookies = cookies();
	const sessionJWTCookie = nextCookies.get(TOKEN_NAME) || { value: "" };
	const sessionRefreshCookie = nextCookies.get(REFRESH_NAME) || { value: "" };
	const loginId = await getIdFromJWT(sessionJWTCookie.value, sessionRefreshCookie.value);
	if (!loginId) {
		return undefined;
	}
	return prisma.user.findUnique({
		where: { id: loginId },
	});
});
