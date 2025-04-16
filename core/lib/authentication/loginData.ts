import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getPathname } from "@nimpl/getters/get-pathname";

import { AuthTokenType } from "db/public";

import type { ExtraSessionValidationOptions } from "./lucia";
import { validateRequest } from "./lucia";

export const getLoginData = cache(async (opts?: ExtraSessionValidationOptions) => {
	return validateRequest(opts);
});

export const getPageLoginData = cache(async () => {
	const loginData = await getLoginData({
		allowedSessions: [AuthTokenType.generic, AuthTokenType.verifyEmail],
	});

	if (!loginData.user) {
		const pathname = getPathname();
		redirect(pathname ? `/login?redirectTo=${encodeURIComponent(pathname)}` : "/login");
	}

	if (loginData.session && loginData.session.type === AuthTokenType.verifyEmail) {
		const pathname = getPathname();
		redirect(pathname ? `/verify?redirectTo=${encodeURIComponent(pathname)}` : "/verify");
	}

	return loginData;
});

export type LoginData = Awaited<ReturnType<typeof getLoginData>>;
