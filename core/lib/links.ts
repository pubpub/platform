import type { PubsId, StagesId } from "db/public"
import type { NoticeParams } from "~/app/components/Notice"

export const maybeWithSearchParams = (basePath: string, searchParams: URLSearchParams) => {
	if (searchParams.size > 0) {
		return `${basePath}?${searchParams.toString()}`
	}
	return basePath
}

export const defaultLoginRedirectError = {
	type: "error",
	title: "You must be logged in to access this page",
	body: "Please log in to continue",
}

export type LoginRedirectOpts = {
	/**
	 * Provide some notice to display on the login page
	 * An `error` will be red, a `notice` will be neutral.
	 *
	 * Set to `false` for no notice.
	 *
	 * @default { type: "error", title: "You must be logged in to access this page", body: "Please log in to continue" }
	 */
	loginNotice?: NoticeParams | false

	/**
	 * Path to redirect the user to after login.
	 * Needs to be of the form `/c/<community-slug>/path`
	 *
	 * @default  currentPathname
	 */
	redirectTo?: string
}

export const constructCommunitySignupLink = (opts: {
	redirectTo: string
	communitySlug: string
	notice?: NoticeParams
	inviteToken?: string
}) => {
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

	const basePath = `/c/${opts.communitySlug}/public/signup`
	return maybeWithSearchParams(basePath, searchParams)
}

export const constructVerifyLink = (opts: { redirectTo: string }) => {
	const searchParams = new URLSearchParams()

	searchParams.set("redirectTo", opts.redirectTo)

	const basePath = `/verify`
	return maybeWithSearchParams(basePath, searchParams)
}

export const constructRedirectToPubEditPage = (opts: {
	pubId: PubsId
	communitySlug: string
	formSlug?: string
}) => {
	const searchParams = new URLSearchParams()
	if (opts.formSlug) {
		searchParams.set("form", opts.formSlug)
	}

	const basePath = `/c/${opts.communitySlug}/pubs/${opts.pubId}/edit`
	return maybeWithSearchParams(basePath, searchParams)
}

export const constructRedirectToPubCreatePage = (opts: {
	communitySlug: string
	formSlug?: string
	relatedPubId?: PubsId
	relatedFieldSlug?: string
}) => {
	const searchParams = new URLSearchParams()
	if (opts.formSlug) {
		searchParams.set("form", opts.formSlug)
	}
	if (opts.relatedPubId) {
		searchParams.set("relatedPubId", opts.relatedPubId.toString())
	}
	if (opts.relatedFieldSlug) {
		searchParams.set("relatedFieldSlug", opts.relatedFieldSlug)
	}

	const basePath = `/c/${opts.communitySlug}/pubs/create`
	return maybeWithSearchParams(basePath, searchParams)
}

export const constructRedirectToPubDetailPage = (opts: {
	pubId: PubsId
	communitySlug: string
	formSlug?: string
}) => {
	const searchParams = new URLSearchParams()
	if (opts.formSlug) {
		searchParams.set("form", opts.formSlug)
	}

	const basePath = `/c/${opts.communitySlug}/pubs/${opts.pubId}`
	return maybeWithSearchParams(basePath, searchParams)
}

export const constructStageMangePanel = (opts: {
	stageId: StagesId
	communitySlug: string
	tab?: "overview" | "pubs" | "actions" | "members"
}) => {
	const searchParams = new URLSearchParams()
	if (opts.tab) {
		searchParams.set("tab", opts.tab)
	}

	searchParams.set("editingStageId", opts.stageId.toString())

	const basePath = `/c/${opts.communitySlug}/stages/manage`
	return maybeWithSearchParams(basePath, searchParams)
}
