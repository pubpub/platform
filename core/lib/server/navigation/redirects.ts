import type { PubsId } from "db/public"
import type { XOR } from "utils/types"
import type { NoticeParams } from "~/app/components/Notice"
import type { LoginRedirectOpts } from "../../links"

import { redirect } from "next/navigation"
import { getPathname } from "@nimpl/getters/get-pathname"

import { logger } from "logger"

import { getLoginData } from "~/lib/authentication/loginData"
import { userCanViewStagePage } from "~/lib/authorization/capabilities"
import {
	constructRedirectToPubCreatePage,
	constructRedirectToPubDetailPage,
	constructRedirectToPubEditPage,
	constructVerifyLink,
	defaultLoginRedirectError,
	maybeWithSearchParams,
} from "../../links"
import { getCommunitySlug } from "../cache/getCommunitySlug"
import { findCommunityBySlug } from "../community"

export const constructLoginLink = (opts?: LoginRedirectOpts) => {
	const searchParams = new URLSearchParams()

	if (opts?.loginNotice !== false) {
		const notice = opts?.loginNotice ?? defaultLoginRedirectError
		searchParams.set(notice.type, notice.title)
		if (notice.body) {
			searchParams.set("body", notice.body)
		}
	}

	const redirectTo = opts?.redirectTo ?? getPathname()
	if (redirectTo) {
		searchParams.set("redirectTo", redirectTo)
	}

	const basePath = `/login`
	return maybeWithSearchParams(basePath, searchParams)
}

/**
 * Redirect the user to the login page, with a notice to display.
 */
export function redirectToLogin(opts?: LoginRedirectOpts): never {
	const basePath = constructLoginLink(opts)
	redirect(basePath)
}

export const constructCommunitySignupLink = async (opts: {
	redirectTo: string
	notice?: NoticeParams
	inviteToken?: string
}) => {
	const communitySlug = await getCommunitySlug()

	const searchParams = new URLSearchParams()

	searchParams.set("redirectTo", opts.redirectTo)

	if (opts.notice) {
		searchParams.set(opts.notice.type, opts.notice.title)
		if (opts.notice.body) {
			searchParams.set("body", opts.notice.body)
		}
	}

	if (opts.inviteToken) {
		searchParams.set("inviteToken", opts.inviteToken)
	}

	const basePath = `/c/${communitySlug}/public/signup`
	return maybeWithSearchParams(basePath, searchParams)
}

/**
 * Redirect the user to the signup page, optionally with a notice.
 *
 * Notice will provide a notice at the top of the signup page
 * NOTE: you need to be inside a community to use this
 */
export async function redirectToCommunitySignup(opts: {
	redirectTo: string
	notice?: NoticeParams
	inviteToken?: string
}): Promise<never> {
	const basePath = await constructCommunitySignupLink(opts)
	redirect(basePath)
}

export function redirectToVerify(opts: { redirectTo: string }): never {
	const basePath = constructVerifyLink(opts)
	redirect(basePath)
}

type RedirectToBaseCommunityPageOpts = XOR<
	{ redirectTo?: string },
	{ searchParams?: Record<string, string> }
> & {
	// can manually specify the community slug to redirect the user to a different community
	communitySlug?: string
}

export const constructRedirectToBaseCommunityPage = async (
	opts?: RedirectToBaseCommunityPageOpts
) => {
	let [{ user }, community] = await Promise.all([
		getLoginData(),
		// weird ternary bc no-params findCommunityBySlug is likely cached, while findCommunityBySlug(undefined) likely isn't
		!opts?.communitySlug ? findCommunityBySlug() : findCommunityBySlug(opts?.communitySlug),
	])

	if (!user) {
		redirectToLogin()
	}
	if (!community) {
		logger.error({
			msg: "No community found for user. Likely had LAST_VISITED_COOKIE set to a community that no longer exists",
			userId: user.id,
			opts,
		})
		community = user.memberships[0]?.community

		if (!community) {
			redirectToLogin()
		}
	}

	const isAbleToViewStages = await userCanViewStagePage(
		user.id,
		community.id,
		opts?.communitySlug
	)

	const searchParams = new URLSearchParams()

	if (opts?.redirectTo) {
		searchParams.set("redirectTo", opts.redirectTo)
	}

	if (opts?.searchParams) {
		Object.entries(opts.searchParams).forEach(([key, value]) => {
			searchParams.set(key, value)
		})
	}

	const page = isAbleToViewStages ? "stages" : "pubs"

	const basePath = `/c/${community.slug}/${page}`
	return maybeWithSearchParams(basePath, searchParams)
}

export async function redirectToUnauthorized(opts?: { communitySlug: string }): Promise<never> {
	const communitySlug = opts?.communitySlug ?? (await getCommunitySlug())

	redirect(`/c/${communitySlug}/unauthorized`)
}

export async function redirectToBaseCommunityPage(
	opts?: RedirectToBaseCommunityPageOpts
): Promise<never> {
	const basePath = await constructRedirectToBaseCommunityPage(opts)
	redirect(basePath)
}

export async function redirectToPubEditPage(opts: {
	pubId: PubsId
	communitySlug?: string
	formSlug?: string
}): Promise<never> {
	const communitySlug = opts.communitySlug ?? (await getCommunitySlug())
	const basePath = constructRedirectToPubEditPage({
		...opts,
		communitySlug,
	})
	redirect(basePath)
}

export async function redirectToPubCreatePage(opts: {
	communitySlug?: string
	formSlug?: string
	relatedPubId?: PubsId
	relatedFieldSlug?: string
}): Promise<never> {
	const communitySlug = opts.communitySlug ?? (await getCommunitySlug())
	const basePath = constructRedirectToPubCreatePage({
		...opts,
		communitySlug,
	})
	redirect(basePath)
}

export async function redirectToPubDetailPage(opts: {
	pubId: PubsId
	communitySlug?: string
	formSlug?: string
}): Promise<never> {
	const communitySlug = opts.communitySlug ?? (await getCommunitySlug())
	const basePath = constructRedirectToPubDetailPage({
		...opts,
		communitySlug,
	})
	redirect(basePath)
}
