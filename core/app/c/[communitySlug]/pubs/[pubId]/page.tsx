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
import { Separator } from "ui/separator"
import { StagesProvider, stagesDAO } from "ui/stages"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"
import { tryCatch } from "utils/try-catch"

import { PubsRunAutomationsDropDownMenu } from "~/app/components/AutomationUI/PubsRunAutomationDropDownMenu"
import { ContextEditorContextProvider } from "~/app/components/ContextEditor/ContextEditorContext"
import { FormSwitcher } from "~/app/components/FormSwitcher/FormSwitcher"
import { PubFormProvider } from "~/app/components/providers/PubFormProvider"
import { CreatePubButton } from "~/app/components/pubs/CreatePubButton"
import { PubTypeLabel } from "~/app/components/pubs/PubCard/PubTypeLabel"
import { StageMoveButton } from "~/app/components/pubs/PubCard/StageMoveButton"
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
import { getPubsWithRelatedValues, getPubTypesForCommunity, NotFoundError } from "~/lib/server"
import { findCommunityBySlug } from "~/lib/server/community"
import { getForm, getSimpleForms } from "~/lib/server/form"
import { resolveFormAccess } from "~/lib/server/form-access"
import { redirectToPubDetailPage, redirectToUnauthorized } from "~/lib/server/navigation/redirects"
import { getPubFields } from "~/lib/server/pubFields"
import { getStages } from "~/lib/server/stages"
import {
	ContentLayoutActions,
	ContentLayoutBody,
	ContentLayoutHeader,
	ContentLayoutRoot,
	ContentLayoutTitle,
} from "../../ContentLayout"
import Move from "../../stages/components/Move"
import { addPubMember, addUserWithPubMembership, removePubMember } from "./actions"
import { PubMembersPanel } from "./components/PubMembersPanel"
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
		{ withAutomations: { filter: [AutomationEvent.manual], detail: "full" } }
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
		allPubTypes,
		availableViewForms,
		availableUpdateForms,
		canArchive,
		canRunActions,
		canAddMember,
		canRemoveMember,
		_canCreateRelatedPub,
		_canRunActionsAllPubs,
		canOverrideAutomationConditions,
		communityStages,
		withExtraPubValues,
		form,
		pubFields,
		availableForms,
	] = await Promise.all([
		pubPromise,
		getPubTypesForCommunity(community.id, { limit: 50 }),
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
		getSimpleForms(),
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

	const _pubTypeHasRelatedPubs = pub.pubType.fields.some((field) => field.isRelation)
	const _pubHasRelatedPubs = pub.values.some((value) => !!value.relatedPub)

	const pubByForm = getPubByForm({ pub, form, withExtraPubValues })

	const { hasAccessToAnyForm: hasAccessToAnyEditForm, canonicalForm: editFormToRedirectTo } =
		resolveFormAccess({
			availableForms: availableUpdateForms,
			requestedFormSlug: formSlug,
			communitySlug,
		})

	const moveFrom = communityStages
		.filter((stage) =>
			stage.moveConstraintSources.some((source) => source.id === pub.stage?.id)
		)
		.map(({ id, name }) => ({ id, name }))
	const moveTo = communityStages
		.filter((stage) =>
			stage.moveConstraints.some((constraint) => constraint.id === pub.stage?.id)
		)
		.map(({ id, name }) => ({ id, name }))

	return (
		<StagesProvider stages={stagesDAO(communityStages)}>
			<PubFieldProvider pubFields={pubFields.fields}>
				<PubFormProvider
					form={{
						pubId: pub.id,
						form,
						mode: "edit",
						isExternalForm: false,
					}}
				>
					<ContextEditorContextProvider
						pubId={pub.id}
						pubTypeId={pub.pubTypeId}
						pubTypes={allPubTypes.map((pubType) => ({
							id: pubType.id,
							name: pubType.name,
						}))}
					>
						<ContentLayoutRoot>
							<ContentLayoutHeader>
								<ContentLayoutTitle>
									<BookOpen
										size={24}
										strokeWidth={1}
										className="mr-3 text-muted-foreground"
									/>
									<div className="flex flex-col">
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
									</div>
								</ContentLayoutTitle>
								<ContentLayoutActions>
									{canArchive && (
										<RemovePubButton
											pubId={pub.id}
											redirectTo={`/c/${communitySlug}/pubs`}
											variant="ghost"
											size="sm"
										/>
									)}
									{canRunActions && (
										<PubsRunAutomationsDropDownMenu
											data-testid="run-automations-primary"
											buttonText="Run"
											automations={pub.stage?.fullAutomations ?? []}
											pubId={pub.id}
											canOverrideAutomationConditions={
												canOverrideAutomationConditions
											}
										/>
									)}
									{hasAccessToAnyEditForm && (
										<Button
											variant="outline"
											size="sm"
											asChild
											className="flex items-center gap-x-2 bg-emerald-500 text-white"
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
								</ContentLayoutActions>
							</ContentLayoutHeader>
							<ContentLayoutBody>
								<div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background px-4 py-1 text-muted-foreground text-sm">
									<PubTypeLabel pubType={pub.pubType} canFilter={false} />
									{pub.stage && (
										<Move
											pubId={pub.id}
											stageId={pub.stage?.id}
											moveTo={moveTo}
											moveFrom={moveFrom}
											// moveFrom={[]}
											// communityStages={communityStages}
											stageName={pub.stage.name}
											hideIfNowhereToMove={false}
											button={
												<StageMoveButton
													data-testid="current-stage"
													stage={pub.stage}
													canFilter={false}
													withDropdown={true}
												/>
											}
										/>
									)}
									<FormSwitcher
										defaultFormSlug={defaultViewForm?.slug}
										forms={availableViewForms}
										className="!bg-transparent !p-0 h-6! text-xs"
									>
										<Eye size={14} />
									</FormSwitcher>
									<PubMembersPanel
										pubId={pub.id}
										members={pub.members ?? []}
										user={user}
										availableForms={availableForms}
										canAddMember={canAddMember}
										canRemoveMember={canRemoveMember}
										addMember={addPubMember.bind(null, pub.id)}
										addUserMember={addUserWithPubMembership.bind(null, pub.id)}
										removeMember={removePubMember}
									/>
								</div>
								<div className="m-4 flex flex-col space-y-4">
									<div className="flex-1">
										<PubValues formSlug={form.slug} pub={pubByForm} />
									</div>

									{(_pubTypeHasRelatedPubs || _pubHasRelatedPubs) && (
										<>
											<Separator className="mt-10" />
											<div
												className="flex flex-col gap-2"
												data-testid="related-pubs"
											>
												<div className="flex items-center justify-between gap-2">
													<h2 className="mb-2 font-semibold">
														Related Pubs
													</h2>
													{_canCreateRelatedPub && (
														<CreatePubButton
															text="Add Related Pub"
															communityId={community.id}
															relatedPub={{
																pubId: pub.id,
																pubTypeId: pub.pubTypeId,
															}}
															className="w-fit"
														/>
													)}
												</div>
												<RelatedPubsTableWrapper
													pub={pubByForm}
													userCanRunActions={_canRunActionsAllPubs}
													userCanOverrideAutomationConditions={
														canOverrideAutomationConditions
													}
												/>
											</div>
										</>
									)}
								</div>
							</ContentLayoutBody>
						</ContentLayoutRoot>
					</ContextEditorContextProvider>
				</PubFormProvider>
			</PubFieldProvider>
		</StagesProvider>
	)
}
