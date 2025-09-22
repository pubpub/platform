import { redirect } from "next/navigation";
import { getPathname } from "@nimpl/getters/get-pathname";

import type { PubsId } from "db/public";
import type { XOR } from "utils/types";

import type { NoticeParams } from "~/app/components/Notice";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCanViewStagePage } from "~/lib/authorization/capabilities";
import { getCommunitySlug } from "../cache/getCommunitySlug";
import { findCommunityBySlug } from "../community";

const defaultLoginRedirectError = {
	type: "error",
	title: "You must be logged in to access this page",
	body: "Please log in to continue",
};

export const maybeWithSearchParams = (basePath: string, searchParams: URLSearchParams) => {
	if (searchParams.size > 0) {
		return `${basePath}?${searchParams.toString()}`;
	}
	return basePath;
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

	const basePath = `/login`;
	return maybeWithSearchParams(basePath, searchParams);
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

	const basePath = `/c/${communitySlug}/public/signup`;
	return maybeWithSearchParams(basePath, searchParams);
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

export const constructVerifyLink = (opts: { redirectTo: string }) => {
	const searchParams = new URLSearchParams();

	searchParams.set("redirectTo", opts.redirectTo);

	const basePath = `/verify`;
	return maybeWithSearchParams(basePath, searchParams);
};

export function redirectToVerify(opts: { redirectTo: string }): never {
	const basePath = constructVerifyLink(opts);
	redirect(basePath);
}

type RedirectToBaseCommunityPageOpts = XOR<
	{ redirectTo?: string },
	{ searchParams?: Record<string, string> }
> & {
	// can manually specify the community slug to redirect the user to a different community
	communitySlug?: string;
};

export const constructRedirectToBaseCommunityPage = async (
	opts?: RedirectToBaseCommunityPageOpts
) => {
	const [{ user }, community] = await Promise.all([
		getLoginData(),
		// weird ternary bc no-params findCommunityBySlug is likely cached, while findCommunityBySlug(undefined) likely isn't
		!opts?.communitySlug ? findCommunityBySlug() : findCommunityBySlug(opts?.communitySlug),
	]);

	if (!user || !community) {
		redirectToLogin();
	}

	const isAbleToViewStages = await userCanViewStagePage(
		user.id,
		community.id,
		opts?.communitySlug
	);

	const searchParams = new URLSearchParams();

	if (opts?.redirectTo) {
		searchParams.set("redirectTo", opts.redirectTo);
	}

	if (opts?.searchParams) {
		Object.entries(opts.searchParams).forEach(([key, value]) => {
			searchParams.set(key, value);
		});
	}

	const page = isAbleToViewStages ? "stages" : "pubs";

	const basePath = `/c/${community.slug}/${page}`;
	return maybeWithSearchParams(basePath, searchParams);
};

export async function redirectToBaseCommunityPage(
	opts?: RedirectToBaseCommunityPageOpts
): Promise<never> {
	const basePath = await constructRedirectToBaseCommunityPage(opts);
	redirect(basePath);
}

export async function redirectToUnauthorized(opts?: { communitySlug: string }): Promise<never> {
	const communitySlug = opts?.communitySlug ?? (await getCommunitySlug());

	redirect(`/c/${communitySlug}/unauthorized`);
}

export const constructRedirectToPubEditPage = (opts: {
	pubId: PubsId;
	communitySlug: string;
	formSlug?: string;
}) => {
	const searchParams = new URLSearchParams();
	if (opts.formSlug) {
		searchParams.set("form", opts.formSlug);
	}

	const basePath = `/c/${opts.communitySlug}/pubs/${opts.pubId}/edit`;
	return maybeWithSearchParams(basePath, searchParams);
};

export async function redirectToPubEditPage(opts: {
	pubId: PubsId;
	communitySlug?: string;
	formSlug?: string;
}): Promise<never> {
	const communitySlug = opts.communitySlug ?? (await getCommunitySlug());
	const basePath = constructRedirectToPubEditPage({
		...opts,
		communitySlug,
	});
	redirect(basePath);
}

export const constructRedirectToPubCreatePage = (opts: {
	communitySlug: string;
	formSlug?: string;
	relatedPubId?: PubsId;
	relatedFieldSlug?: string;
}) => {
	const searchParams = new URLSearchParams();
	if (opts.formSlug) {
		searchParams.set("form", opts.formSlug);
	}
	if (opts.relatedPubId) {
		searchParams.set("relatedPubId", opts.relatedPubId.toString());
	}
	if (opts.relatedFieldSlug) {
		searchParams.set("relatedFieldSlug", opts.relatedFieldSlug);
	}

	const basePath = `/c/${opts.communitySlug}/pubs/create`;
	return maybeWithSearchParams(basePath, searchParams);
};

export async function redirectToPubCreatePage(opts: {
	communitySlug?: string;
	formSlug?: string;
	relatedPubId?: PubsId;
	relatedFieldSlug?: string;
}): Promise<never> {
	const communitySlug = opts.communitySlug ?? (await getCommunitySlug());
	const basePath = constructRedirectToPubCreatePage({
		...opts,
		communitySlug,
	});
	redirect(basePath);
}

export const constructRedirectToPubDetailPage = (opts: {
	pubId: PubsId;
	communitySlug: string;
	formSlug?: string;
}) => {
	const searchParams = new URLSearchParams();
	if (opts.formSlug) {
		searchParams.set("form", opts.formSlug);
	}

	const basePath = `/c/${opts.communitySlug}/pubs/${opts.pubId}`;
	return maybeWithSearchParams(basePath, searchParams);
};

export async function redirectToPubDetailPage(opts: {
	pubId: PubsId;
	communitySlug?: string;
	formSlug?: string;
}): Promise<never> {
	const communitySlug = opts.communitySlug ?? (await getCommunitySlug());
	const basePath = constructRedirectToPubDetailPage({
		...opts,
		communitySlug,
	});
	redirect(basePath);
}
