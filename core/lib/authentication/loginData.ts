import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getPathname } from "@nimpl/getters/get-pathname";

import type { ExtraSessionValidationOptions } from "./lucia";
import { validateRequest } from "./lucia";

export const getLoginData = cache(async (opts?: ExtraSessionValidationOptions) => {
	return validateRequest(opts);
});

const defaultLoginRedirectError = {
	type: "error",
	title: "You must be logged in to access this page",
	body: "Please log in to continue",
};

type LoginRedirectOpts = {
	loginNotice?: {
		type: "error" | "notice";
		title: string;
		body?: string;
	};
};

export const redirectToLogin = (opts?: LoginRedirectOpts) => {
	const pathname = getPathname();
	const notice = opts?.loginNotice ?? defaultLoginRedirectError;
	const noticeParams = new URLSearchParams();
	noticeParams.set(notice.type, notice.title);
	if (notice.body) {
		noticeParams.set("body", notice.body);
	}

	const basePath = `/login?${noticeParams.toString()}`;
	redirect(pathname ? `${basePath}&redirectTo=${encodeURIComponent(pathname)}` : basePath);
};
export const getPageLoginData = cache(
	async (opts?: ExtraSessionValidationOptions & LoginRedirectOpts) => {
		const loginData = await getLoginData(opts);

		if (!loginData.user) {
			redirectToLogin(opts);
		}

		return loginData;
	}
);

export type LoginData = Awaited<ReturnType<typeof getLoginData>>;
