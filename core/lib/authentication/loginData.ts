import "server-only";

import type { Session, User } from "lucia";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getPathname } from "@nimpl/getters/get-pathname";

import { AuthTokenType } from "db/public";
import { expect } from "utils";

import type { LoginRedirectOpts } from "../server/navigation/redirects";
import type { ExtraSessionValidationOptions } from "./lucia";
import { redirectToLogin, redirectToVerify } from "../server/navigation/redirects";
import { validateRequest } from "./lucia";

/**
 * Get the users login data based on the session cookie
 */
export const getLoginData = cache(async (opts?: ExtraSessionValidationOptions) => {
	return validateRequest(opts);
});

const defaultPageOpts: ExtraSessionValidationOptions & LoginRedirectOpts = {
	allowedSessions: [AuthTokenType.generic, AuthTokenType.verifyEmail],
};

/**
 * Get the login data for the current page, and redirect to the login page if the user is not logged in.
 */
export const getPageLoginData = cache(
	async (opts?: ExtraSessionValidationOptions & LoginRedirectOpts) => {
		const options = opts ?? defaultPageOpts;
		const loginData = await getLoginData(options);

		if (!loginData.user) {
			redirectToLogin(options);
		}

		if (loginData.session && loginData.session.type === AuthTokenType.verifyEmail) {
			const pathname = getPathname();
			redirectToVerify({
				redirectTo: expect(pathname, "pathname is missing for redirectToVerify").toString(),
			});
		}

		return loginData;
	}
);

export type LoginData = Awaited<ReturnType<typeof getLoginData>>;
