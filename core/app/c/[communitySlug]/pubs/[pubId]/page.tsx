import type { Metadata } from "next"

import { cache } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BookOpen, Eye, Pencil } from "lucide-react"

import {
	AutomationEvent,
	Capabilities,
	type CommunitiesId,
	MembershipType,
	type PubsId,
} from "db/public"
import { Button } from "ui/button"
import { PubFieldProvider } from "ui/pubFields"
import { StagesProvider, stagesDAO } from "ui/stages"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"
import { tryCatch } from "utils/try-catch"

import { PubsRunAutomationsDropDownMenu } from "~/app/components/AutomationUI/PubsRunAutomationDropDownMenu"
import { FormSwitcher } from "~/app/components/FormSwitcher/FormSwitcher"
import { AddMemberDialog } from "~/app/components/Memberships/AddMemberDialog"
import { MembersList } from "~/app/components/Memberships/MembersList"
import { CreatePubButton } from "~/app/components/pubs/CreatePubButton"
import { RemovePubButton } from "~/app/components/pubs/RemovePubButton"
import { getPageLoginData } from "~/lib/authentication/loginData"
import {
	getAuthorizedUpdateForms,
	getAuthorizedViewForms,
	userCan,
	userCanRunActionsAllPubs,
} from "~/lib/authorization/capabilities"
import { constructRedirectToPubEditPage } from "~/lib/links"
import { getPubByForm, getPubTitle } from "~/lib/pubs"
import { getPubsWithRelatedValues, NotFoundError } from "~/lib/server"
import { findCommunityBySlug } from "~/lib/server/community"
import { getForm } from "~/lib/server/form"
import { resolveFormAccess } from "~/lib/server/form-access"
import { redirectToPubDetailPage, redirectToUnauthorized } from "~/lib/server/navigation/redirects"
import { getPubFields } from "~/lib/server/pubFields"
import { getStages } from "~/lib/server/stages"
import { ContentLayout } from "../../ContentLayout"
import Move from "../../stages/components/Move"
import {
	addPubMember,
	addUserWithPubMembership,
	removePubMember,
	setPubMemberRole,
} from "./actions"
import { PubValues } from "./components/PubValues"
import { RelatedPubsTableWrapper } from "./components/RelatedPubsTableWrapper"

const getPubsWithRelatedValuesCached = cache(async (pubId: PubsId, communityId: CommunitiesId) => {
	const [error, pub] = await tryCatch(
		getPubsWithRelatedValues(
			{
				pubId,
				communityId,
			},
			{
				withPubType: true,
				withRelatedPubs: true,
				withStage: true,
				withStageAutomations: {
					detail: "full",
					filter: [AutomationEvent.manual],
				},
				withMembers: true,
				depth: 3,
			}
		)
	)
	if (error && !(error instanceof NotFoundError)) {
		throw error
	}

	return pub
})

export async function generateMetadata(props: {
	params: Promise<{ pubId: PubsId; communitySlug: string }>
}): Promise<Metadata> {
	const community = await findCommunityBySlug()

	if (!community) {
		notFound()
	}

	const params = await props.params

	const { pubId } = params

	// TODO: replace this with the same function as the one which is used in the page to take advantage of request deduplication using `React.cache`

	const pub = await getPubsWithRelatedValuesCached(pubId, community.id)

	if (!pub) {
		return { title: "Pub Not Found" }
	}

	const title = getPubTitle(pub)

	return { title }
}

export default async function Page(props: {
	params: Promise<{ pubId: PubsId; communitySlug: string }>
	searchParams: Promise<Record<string, string>>
}) {
	const { form: formSlug } = await props.searchParams
	const params = await props.params
	const { pubId, communitySlug } = params

	const [{ user }, community] = await Promise.all([getPageLoginData(), findCommunityBySlug()])

	if (!pubId || !communitySlug) {
		return notFound()
	}

	if (!community) {
		notFound()
	}

	const communityStagesPromise = getStages(
		{
			communityId: community.id,
			userId: user.id,
		},
		{ withAutomations: AutomationEvent.manual }
	).execute()

	// We don't pass the userId here because we want to include related pubs regardless of authorization
	// This is safe because we've already explicitly checked authorization for the root pub
	const pubPromise = getPubsWithRelatedValuesCached(pubId, community.id)

	// if a specific form is provided, we use the slug
	// otherwise, we get the default form for the pub type of the current pub
	const getFormProps = formSlug
		? { communityId: community.id, slug: formSlug }
		: { communityId: community.id, pubId }

	// surely this can be done in fewer queries
	const [
		pub,
		availableViewForms,
		availableUpdateForms,
		canArchive,
		canRunActions,
		canAddMember,
		canRemoveMember,
		canCreateRelatedPub,
		canRunActionsAllPubs,
		canOverrideAutomationConditions,
		communityStages,
		withExtraPubValues,
		form,
		pubFields,
	] = await Promise.all([
		pubPromise,
		getAuthorizedViewForms(user.id, pubId).execute(),
		getAuthorizedUpdateForms(user.id, pubId).execute(),
		userCan(Capabilities.deletePub, { type: MembershipType.pub, pubId }, user.id),
		userCan(Capabilities.runAction, { type: MembershipType.pub, pubId }, user.id),
		userCan(Capabilities.addPubMember, { type: MembershipType.pub, pubId }, user.id),
		userCan(Capabilities.removePubMember, { type: MembershipType.pub, pubId }, user.id),
		userCan(Capabilities.createRelatedPub, { type: MembershipType.pub, pubId }, user.id),
		userCan(
			Capabilities.overrideAutomationConditions,
			{ type: MembershipType.community, communityId: community.id },
			user.id
		),
		userCanRunActionsAllPubs(communitySlug),
		communityStagesPromise,
		userCan(
			Capabilities.seeExtraPubValues,
			{ type: MembershipType.pub, pubId: pubId },
			user.id
		),
		getForm(getFormProps).executeTakeFirst(),
		getPubFields({ communityId: community.id }).executeTakeFirstOrThrow(),
	])

	if (!pub) {
		notFound()
	}

	// ensure user has access to at least one view form, and resolve the current form
	const {
		hasAccessToAnyForm: hasAccessToAnyViewForm,
		hasAccessToCurrentForm: hasAccessToCurrentViewForm,
		canonicalForm: viewFormToRedirectTo,
		defaultForm: defaultViewForm,
	} = resolveFormAccess({
		availableForms: availableViewForms,
		requestedFormSlug: formSlug,
		communitySlug,
	})

	if (!hasAccessToAnyViewForm) {
		return await redirectToUnauthorized()
	}

	if (!hasAccessToCurrentViewForm) {
		return await redirectToPubDetailPage({
			pubId,
			communitySlug,
			formSlug: viewFormToRedirectTo.slug,
		})
	}

	if (!form) {
		return null
	}

	if (!availableViewForms.length) {
		return null
	}

	const pubTypeHasRelatedPubs = pub.pubType.fields.some((field) => field.isRelation)
	const pubHasRelatedPubs = pub.values.some((value) => !!value.relatedPub)

	const { stage } = pub
	const pubByForm = getPubByForm({ pub, form, withExtraPubValues })

	const { hasAccessToAnyForm: hasAccessToAnyEditForm, canonicalForm: editFormToRedirectTo } =
		resolveFormAccess({
			availableForms: availableUpdateForms,
			requestedFormSlug: formSlug,
			communitySlug,
		})

	return (
		<ContentLayout
			title={
				<>
					<BookOpen size={24} strokeWidth={1} className="mr-3 text-muted-foreground" />
					<div>
						<Tooltip delayDuration={300}>
							<TooltipTrigger className="m-0 line-clamp-1 p-0 text-left">
								{getPubTitle(pub)}
							</TooltipTrigger>
							<TooltipContent
								side="bottom"
								align="start"
								className="max-w-sm text-xs"
							>
								{getPubTitle(pub)}
							</TooltipContent>
						</Tooltip>
						<div className="flex items-center gap-1 text-muted-foreground text-sm">
							<span className="font-semibold">{pub.pubType.name}</span>•
							<FormSwitcher
								defaultFormSlug={defaultViewForm?.slug}
								forms={availableViewForms}
								className="p-1 text-xs"
							>
								<Eye size={14} />
							</FormSwitcher>
						</div>
					</div>
				</>
			}
			right={
				<div className="flex items-center gap-2">
					{canArchive && (
						<RemovePubButton pubId={pub.id} redirectTo={`/c/${communitySlug}/pubs`} />
					)}
					{hasAccessToAnyEditForm && (
						<Button
							variant="outline"
							size="sm"
							asChild
							className="flex items-center gap-x-2 bg-emerald-500 py-4 text-white"
						>
							<Link
								href={constructRedirectToPubEditPage({
									pubId,
									communitySlug,
									formSlug: editFormToRedirectTo.slug,
								})}
							>
								<Pencil size="12" />
								<span>Update</span>
							</Link>
						</Button>
					)}
				</div>
			}
		>
			<StagesProvider stages={stagesDAO(communityStages)}>
				<PubFieldProvider pubFields={pubFields.fields}>
					<div className="m-4 flex flex-col space-y-4">
						<div className="flex flex-wrap space-x-4">
							<div className="flex-1">
								<PubValues pub={pubByForm} />
							</div>
							<div className="flex w-96 flex-col gap-4 rounded-lg bg-muted p-4 shadow-inner">
								{pub.stage ? (
									<div>
										<div className="mb-1 font-bold text-lg">Current Stage</div>
										<div
											className="ml-4 flex items-center gap-2 font-medium"
											data-testid="current-stage"
										>
											<Move
												stageName={pub.stage.name}
												pubId={pub.id}
												stageId={pub.stage.id}
												communityStages={communityStages}
											/>
										</div>
									</div>
								) : null}
								<div>
									<div className="mb-1 font-bold text-lg">Actions</div>
									{pub.stage?.fullAutomations &&
									pub.stage?.fullAutomations.length > 0 &&
									stage &&
									canRunActions ? (
										<div className="ml-4">
											<PubsRunAutomationsDropDownMenu
												canOverrideAutomationConditions={
													canOverrideAutomationConditions
												}
												automations={pub.stage.fullAutomations}
												pubId={pubId}
												testId="run-action-primary"
											/>
										</div>
									) : (
										<div className="ml-4 font-medium">
											Configure actions to run for this Pub in the stage
											management settings
										</div>
									)}
								</div>

								<div className="flex flex-col gap-y-4">
									<div className="mb-2 flex justify-between">
										<span className="font-bold text-lg">Members</span>
										{canAddMember && (
											<AddMemberDialog
												addMember={addPubMember.bind(null, pubId)}
												addUserMember={addUserWithPubMembership.bind(
													null,
													pubId
												)}
												existingMembers={pub.members.map(
													(member) => member.id
												)}
												isSuperAdmin={user.isSuperAdmin}
												membershipType={MembershipType.pub}
												availableForms={availableViewForms}
											/>
										)}
									</div>
									<MembersList
										members={pub.members}
										membershipType={MembershipType.pub}
										setRole={setPubMemberRole}
										removeMember={removePubMember}
										targetId={pubId}
										readOnly={!canRemoveMember}
										availableForms={availableViewForms}
									/>
								</div>
							</div>
						</div>
						{(pubTypeHasRelatedPubs || pubHasRelatedPubs) && (
							<div className="flex flex-col gap-2" data-testid="related-pubs">
								<h2 className="mb-2 font-bold text-xl">Related Pubs</h2>
								{canCreateRelatedPub && (
									<CreatePubButton
										text="Add Related Pub"
										communityId={community.id}
										relatedPub={{ pubId: pub.id, pubTypeId: pub.pubTypeId }}
										className="w-fit"
									/>
								)}
								<RelatedPubsTableWrapper
									pub={pubByForm}
									userCanRunActions={canRunActionsAllPubs}
									userCanOverrideAutomationConditions={
										canOverrideAutomationConditions
									}
								/>
							</div>
						)}
					</div>
				</PubFieldProvider>
			</StagesProvider>
		</ContentLayout>
	)
}
