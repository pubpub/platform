import type { CommunitiesId, PubsId, UsersId } from "db/public"
import type { Metadata } from "next"

import { cache } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BookOpen, ChevronLeft } from "lucide-react"

import { Button } from "ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"
import { tryCatch } from "utils/try-catch"

import {
	ContentLayoutActions,
	ContentLayoutBody,
	ContentLayoutHeader,
	ContentLayoutRoot,
	ContentLayoutStickySecondaryHeader,
	ContentLayoutTitle,
} from "~/app/c/[communitySlug]/ContentLayout"
import { PubPageStatus } from "~/app/components/pubs/PubEditor/PageTitleWithStatus"
import { PubEditor } from "~/app/components/pubs/PubEditor/PubEditor"
import DebugLoading from "~/app/components/skeletons/DebugLoading"
import { getPageLoginData } from "~/lib/authentication/loginData"
import { getAuthorizedUpdateForms, getAuthorizedViewForms } from "~/lib/authorization/capabilities"
import { constructRedirectToPubDetailPage } from "~/lib/links"
import { getPubTitle } from "~/lib/pubs"
import { getPubsWithRelatedValues, NotFoundError } from "~/lib/server"
import { findCommunityBySlug } from "~/lib/server/community"
import { resolveFormAccess } from "~/lib/server/form-access"
import { redirectToPubEditPage, redirectToUnauthorized } from "~/lib/server/navigation/redirects"
import Loading from "./loading"

const getPubsWithRelatedValuesCached = cache(
	async ({
		userId,
		pubId,
		communityId,
	}: {
		userId?: UsersId
		pubId: PubsId
		communityId: CommunitiesId
	}) => {
		const [error, pub] = await tryCatch(
			getPubsWithRelatedValues(
				{
					pubId,
					communityId,
					userId,
				},
				{
					withPubType: true,
					withStage: true,
				}
			)
		)
		if (error && !(error instanceof NotFoundError)) {
			throw error
		}

		return pub
	}
)

export async function generateMetadata(props: {
	params: Promise<{ pubId: string; communitySlug: string }>
}): Promise<Metadata> {
	const params = await props.params

	const { pubId, communitySlug } = params

	const community = await findCommunityBySlug(communitySlug)
	if (!community) {
		return { title: "Community Not Found" }
	}

	const pub = await getPubsWithRelatedValuesCached({
		pubId: pubId as PubsId,
		communityId: community.id as CommunitiesId,
	})

	if (!pub) {
		return { title: "Pub Not Found" }
	}

	const title = getPubTitle(pub)

	if (!title) {
		return { title: `Edit Pub ${pub.id}` }
	}

	return { title: title as string }
}

export default async function Page(props: {
	params: Promise<{ pubId: PubsId; communitySlug: string }>
	searchParams: Promise<Record<string, string> & { form: string }>
}) {
	const searchParams = await props.searchParams
	const params = await props.params
	const { pubId, communitySlug } = params

	if (!pubId || !communitySlug) {
		return notFound()
	}

	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(communitySlug),
	])

	if (!community) {
		notFound()
	}

	const [pub, availableUpdateForms, availableViewForms] = await Promise.all([
		getPubsWithRelatedValuesCached({
			pubId: params.pubId as PubsId,
			communityId: community.id,
			userId: user.id,
		}),

		getAuthorizedUpdateForms(user.id, params.pubId).execute(),
		getAuthorizedViewForms(user.id, params.pubId).execute(),
	])

	if (!pub) {
		return notFound()
	}

	// ensure user has access to at least one form, and resolve the current form
	// const {
	// 	hasAccessToAnyForm: hasAccessToAnyUpdateForm,
	// 	hasAccessToCurrentForm: hasAccessToCurrentUpdateForm,
	// 	canonicalForm: updateFormToRedirectTo,
	const {
		hasAccessToAnyForm: hasAccessToAnyUpdateForm,
		hasAccessToCurrentForm: hasAccessToCurrentUpdateForm,
		canonicalForm: updateFormToRedirectTo,
	} = resolveFormAccess({
		availableForms: availableUpdateForms,
		requestedFormSlug: searchParams.form,
		communitySlug,
	})

	if (!hasAccessToAnyUpdateForm) {
		return await redirectToUnauthorized()
	}

	if (!hasAccessToCurrentUpdateForm) {
		return await redirectToPubEditPage({
			pubId,
			communitySlug,
			formSlug: updateFormToRedirectTo.slug,
		})
	}

	const { hasAccessToAnyForm: hasAccessToAnyViewForm, canonicalForm: viewFormToRedirectTo } =
		resolveFormAccess({
			availableForms: availableViewForms,
			requestedFormSlug: searchParams.form,
			communitySlug,
		})

	const htmlFormId = `edit-pub-${pub.id}`

	return (
		<DebugLoading loading={<Loading />}>
			<ContentLayoutRoot>
				<ContentLayoutHeader>
					<ContentLayoutTitle>
						{hasAccessToAnyViewForm ? (
							<Link
								data-testid="back-to-pub-detail"
								href={constructRedirectToPubDetailPage({
									pubId,
									communitySlug,
									formSlug: viewFormToRedirectTo.slug,
								})}
							>
								<ChevronLeft size={24} className="mr-3" strokeWidth={1} />
							</Link>
						) : (
							<BookOpen
								size={24}
								strokeWidth={1}
								className="mr-3 size-6! grow text-muted-foreground"
							/>
						)}

						<div className="flex flex-col">
							<Tooltip delayDuration={300}>
								<TooltipTrigger className="m-0 line-clamp-1 p-0 text-left">
									{getPubTitle(pub)}
								</TooltipTrigger>
								<TooltipContent
									side="bottom"
									align="start"
									className="z-[200] max-w-sm text-xs"
								>
									{getPubTitle(pub)}
								</TooltipContent>
							</Tooltip>
						</div>
					</ContentLayoutTitle>
					<ContentLayoutActions>
						<Button form={htmlFormId} type="submit" size="sm">
							Save
						</Button>
					</ContentLayoutActions>
				</ContentLayoutHeader>

				<ContentLayoutBody>
					<ContentLayoutStickySecondaryHeader>
						<PubPageStatus
							defaultFormSlug={searchParams.form}
							forms={availableUpdateForms}
						/>
					</ContentLayoutStickySecondaryHeader>
					<div className="flex justify-center py-10">
						<div className="max-w-full flex-1 md:max-w-prose">
							{/** TODO: Add suspense */}
							<PubEditor
								mode="edit"
								pubId={pub.id}
								pub={pub}
								htmlFormId={htmlFormId}
								pubTypeId={pub.pubTypeId}
								form={updateFormToRedirectTo}
							/>
						</div>
					</div>
				</ContentLayoutBody>
			</ContentLayoutRoot>
		</DebugLoading>
	)
}
