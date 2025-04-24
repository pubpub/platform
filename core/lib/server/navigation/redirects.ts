import { redirect } from "next/navigation";
import { getPathname } from "@nimpl/getters/get-pathname";

import type { NoticeParams } from "~/app/components/Notice";
import { getCommunitySlug } from "../cache/getCommunitySlug";

const defaultLoginRedirectError = {
	type: "error",
	title: "You must be logged in to access this page",
	body: "Please log in to continue",
};

export type LoginRedirectOpts = {
	/**
	 * Provide some notice to display on the login page
	 * An `error` will be red, a `notice` will be neutral.
	 *
	 * Set to `false` for no notice.
	 *
	 * @default { type: "error", title: "You must be logged in to access this page", body: "Please log in to continue" }
	 */
	loginNotice?: NoticeParams | false;

	/**
	 * Path to redirect the user to after login.
	 * Needs to be of the form `/c/<community-slug>/path`
	 *
	 * @default  currentPathname
	 */
	redirectTo?: string;
};

export const constructLoginLink = (opts?: LoginRedirectOpts) => {
	const searchParams = new URLSearchParams();

	if (opts?.loginNotice !== false) {
		const notice = opts?.loginNotice ?? defaultLoginRedirectError;
		searchParams.set(notice.type, notice.title);
		if (notice.body) {
			searchParams.set("body", notice.body);
		}
	}

	const redirectTo = opts?.redirectTo ?? getPathname();
	if (redirectTo) {
		searchParams.set("redirectTo", redirectTo);
	}

	const basePath = `/login?${searchParams.toString()}`;
	return basePath;
};

/**
 * Redirect the user to the login page, with a notice to display.
 */
export function redirectToLogin(opts?: LoginRedirectOpts): never {
	const basePath = constructLoginLink(opts);
	redirect(basePath);
}

export const constructCommunitySignupLink = async (opts: {
	redirectTo: string;
	notice?: NoticeParams;
	inviteToken?: string;
}) => {
	const communitySlug = await getCommunitySlug();

	const searchParams = new URLSearchParams();

	searchParams.set("redirectTo", opts.redirectTo);

	if (opts.notice) {
		searchParams.set(opts.notice.type, opts.notice.title);
		if (opts.notice.body) {
			searchParams.set("body", opts.notice.body);
		}
	}

	if (opts.inviteToken) {
		searchParams.set("inviteToken", opts.inviteToken);
	}

	const basePath = `/c/${communitySlug}/public/signup?${searchParams.toString()}`;
	return basePath;
};

/**
 * Redirect the user to the signup page, optionally with a notice.
 *
 * Notice will provide a notice at the top of the signup page
 * NOTE: you need to be inside a community to use this
 */
export async function redirectToCommunitySignup(opts: {
	redirectTo: string;
	notice?: NoticeParams;
	inviteToken?: string;
}): Promise<never> {
	const basePath = await constructCommunitySignupLink(opts);
	redirect(basePath);
}

export const constructVerifyLink = (opts?: LoginRedirectOpts) => {
	const searchParams = new URLSearchParams();

	if (opts?.loginNotice !== false) {
		const notice = opts?.loginNotice ?? defaultLoginRedirectError;
		searchParams.set(notice.type, notice.title);
		if (notice.body) {
			searchParams.set("body", notice.body);
		}
	}

	const basePath = `/verify?${searchParams.toString()}`;
	return basePath;
};

export function redirectToVerify(opts?: LoginRedirectOpts): never {
	const basePath = constructVerifyLink(opts);
	redirect(basePath);
}
