import type { ProcessedPub } from "contracts"
import type { UsersId } from "db/public"
import type { FullAutomation } from "db/types"
import type React from "react"
import type { CommunityStage } from "~/lib/server/stages"

import { Suspense } from "react"
import Link from "next/link"

import { Capabilities, MembershipType } from "db/public"
import { Button } from "ui/button"
import { Pencil, Trash2 } from "ui/icon"
import { cn } from "utils"

import Move from "~/app/c/[communitySlug]/stages/components/Move"
import { userCan, userCanEditPub } from "~/lib/authorization/capabilities"
import { getPubTitle } from "~/lib/pubs"
import { PubSelector } from "../../../c/[communitySlug]/pubs/PubSelector"
import { PubsRunAutomationsDropDownMenu } from "../../AutomationUI/PubsRunAutomationDropDownMenu"
import { SkeletonButton } from "../../skeletons/SkeletonButton"
import { RelationsDropDown } from "../RelationsDropDown"
import { RemovePubButton } from "../RemovePubButton"
import {
	PubCard,
	PubCardContent,
	PubCardCreatedAt,
	PubCardFooter,
	PubCardHeader,
	PubCardMatchingValues,
	PubCardTitle,
	PubCardUpdatedAt,
} from "./PubCardClient"
import { PubTypeLabel } from "./PubTypeLabel"
import { StageMoveButton } from "./StageMoveButton"

const HOVER_CLASS = ""
// "opacity-0 group-hover:opacity-100 transition-opacity duration-200 group-focus-within:opacity-100"

// So that the whole card can be clickable as a link
const _LINK_AFTER =
	"after:content-[''] after:z-0 after:absolute after:left-0 after:top-0 after:bottom-0 after:right-0"

export type PubCardProps = {
	pub: ProcessedPub<{
		withPubType: true
		withRelatedPubs: false
		withStage: true
		withRelatedCounts: true
	}>
	communitySlug: string
	moveFrom?: CommunityStage["moveConstraintSources"]
	moveTo?: CommunityStage["moveConstraints"]
	manualAutomations?: Omit<FullAutomation, "lastAutomationRun">[]
	withSelection?: boolean
	userId: UsersId
	/* if true, overrides the view stage capability check */
	canViewAllStages?: boolean
	/* if true, overrides the edit pub capability check */
	canEditAllPubs?: boolean
	/* if true, overrides the archive pub capability check */
	canArchiveAllPubs?: boolean
	/* if true, overrides the run actions capability check */
	canRunActionsAllPubs?: boolean
	/* if true, overrides the move pub capability check. dramatically reduces the number of queries for admins and editors and the like */
	canMoveAllPubs?: boolean
	canFilter?: boolean
}

export const PubCardServer = async ({
	pub,
	communitySlug,
	moveFrom,
	moveTo,
	manualAutomations,
	withSelection = true,
	userId,
	canEditAllPubs,
	canArchiveAllPubs,
	canRunActionsAllPubs,
	canMoveAllPubs,
	canViewAllStages,
	canFilter,
	...props
}: PubCardProps & React.HTMLAttributes<HTMLDivElement>) => {
	const matchingValues = pub.matchingValues?.filter((match) => !match.isTitle)

	const showMatchingValues = matchingValues && matchingValues.length !== 0
	const hasActions = pub.stage && manualAutomations && manualAutomations.length !== 0

	return (
		<PubCard {...props} data-testid={`pub-card-${pub.id}`}>
			<PubCardContent>
				<PubCardHeader>
					<PubTypeLabel pubType={pub.pubType} canFilter={canFilter} />
					{pub.stage ? (
						<Move
							stageName={pub.stage.name}
							pubId={pub.id}
							stageId={pub.stage.id}
							moveFrom={moveFrom ?? []}
							moveTo={moveTo ?? []}
							hideIfNowhereToMove={false}
							canMoveAllPubs={canMoveAllPubs}
							canViewAllStages={canViewAllStages}
							button={
								<StageMoveButton
									stage={pub.stage}
									canFilter={canFilter}
									withDropdown={!!(moveTo?.length || moveFrom?.length)}
								/>
							}
						/>
					) : null}
					{pub.relatedPubsCount ? (
						<RelationsDropDown pubId={pub.id} numRelations={pub.relatedPubsCount} />
					) : null}
				</PubCardHeader>
				<PubCardTitle pubId={pub.id} bigLink={true}>
					<div
						className="[&_mark]:bg-yellow-300"
						dangerouslySetInnerHTML={{ __html: getPubTitle(pub) }}
					/>
				</PubCardTitle>
				{showMatchingValues && (
					<div
						className={cn(
							"grid grid-cols-[minmax(0rem,auto)_minmax(0,1fr)] gap-1 text-muted-foreground text-xs",
							"[&_mark]:bg-yellow-200"
						)}
					>
						{/* Matching values that aren't titles */}
						<PubCardMatchingValues matchingValues={matchingValues} />
					</div>
				)}
				<PubCardFooter>
					<PubCardCreatedAt createdAt={pub.createdAt} />

					<PubCardUpdatedAt updatedAt={pub.updatedAt} />
				</PubCardFooter>
			</PubCardContent>
			<div className="-translate-y-1/2 after:-left-10 -right-1 absolute top-1/2 z-10 mr-4 w-fit shrink-0 bg-card transition-opacity duration-200 after:absolute after:top-0 after:z-0 after:h-full after:w-10 after:bg-gradient-to-r after:from-card/0 after:to-card/100 after:content-[''] group-focus-within:opacity-100 group-hover:opacity-100 md:opacity-0">
				{/* We use grid and order-[x] to place items according to the design, but 
				PubsRunActionDropDownMenu needs to be first so it can have `peer`. The other
				buttons check if the `peer` is open, and if it is, it does not lose opacity.
				Otherwise, when the dropdown menu opens, the buttons all fade away */}
				<div
					className={cn(
						"grid w-fit items-center gap-2 text-muted-foreground md:gap-1",
						withSelection && hasActions && "grid-cols-4",
						withSelection && !hasActions && "grid-cols-3",
						!withSelection && hasActions && "grid-cols-3",
						!withSelection && !hasActions && "grid-cols-2"
					)}
				>
					<Suspense
						fallback={
							<>
								{hasActions ? (
									<div
										className={cn(
											"peer order-2 data-[state=open]:opacity-100",
											HOVER_CLASS
										)}
									>
										<SkeletonButton className="mx-1 h-6 w-6" />
									</div>
								) : null}
								<div
									className={cn(
										"order-1 peer-data-[state=open]:opacity-100",
										HOVER_CLASS
									)}
								>
									<SkeletonButton className="mx-1 h-6 w-6" />
								</div>
								<div
									className={cn(
										"order-3 peer-data-[state=open]:opacity-100",
										HOVER_CLASS
									)}
								>
									<SkeletonButton className="mx-1 h-6 w-6" />
								</div>
							</>
						}
					>
						<PubCardActions
							manualAutomations={manualAutomations ?? []}
							pub={pub}
							communitySlug={communitySlug}
							userId={userId}
							canEditAllPubs={canEditAllPubs}
							canArchiveAllPubs={canArchiveAllPubs}
							canRunActionsAllPubs={canRunActionsAllPubs}
						/>
					</Suspense>
					{withSelection ? (
						<PubSelector
							pubId={pub.id}
							className={cn(
								"order-4 box-content h-4 w-4 border-muted-foreground data-[state=checked]:opacity-100 peer-data-[state=open]:opacity-100",
								HOVER_CLASS
							)}
						/>
					) : null}
				</div>
			</div>
		</PubCard>
	)
}

const PubCardActions = async ({
	manualAutomations,
	pub,
	communitySlug,
	userId,
	canEditAllPubs,
	canArchiveAllPubs,
	canRunActionsAllPubs,
}: {
	manualAutomations: Omit<FullAutomation, "lastAutomationRun">[]
	pub: ProcessedPub<{
		withPubType: true
		withRelatedPubs: false
		withStage: true
		withRelatedCounts: true
	}>
	communitySlug: string
	userId: UsersId
	canEditAllPubs?: boolean
	canArchiveAllPubs?: boolean
	canRunActionsAllPubs?: boolean
}) => {
	const hasAutomations = pub.stage && manualAutomations && manualAutomations.length !== 0
	const pubTitle = getPubTitle(pub)
	const [canArchive, canRunActions, canEdit, canOverrideAutomationConditions] = await Promise.all(
		[
			canArchiveAllPubs ||
				userCan(
					Capabilities.deletePub,
					{
						type: MembershipType.pub,
						pubId: pub.id,
					},
					userId
				),
			canRunActionsAllPubs ||
				userCan(
					Capabilities.runAction,
					{
						type: MembershipType.pub,
						pubId: pub.id,
					},
					userId
				),
			canEditAllPubs ||
				userCanEditPub({
					userId,
					pubId: pub.id,
				}),

			canRunActionsAllPubs ||
				userCan(
					Capabilities.overrideAutomationConditions,
					{
						type: MembershipType.community,
						communityId: pub.communityId,
					},
					userId
				),
		]
	)

	return (
		<>
			{hasAutomations && canRunActions ? (
				<PubsRunAutomationsDropDownMenu
					canOverrideAutomationConditions={canOverrideAutomationConditions}
					automations={manualAutomations}
					pubId={pub.id}
					buttonText={`Run automations for ${pubTitle}`}
					iconOnly
					variant="ghost"
					className={cn(
						"peer order-2 w-6 px-4 py-2 data-[state=open]:opacity-100 [&_svg]:size-6",
						HOVER_CLASS
					)}
				/>
			) : null}
			{canArchive ? (
				<RemovePubButton
					pubId={pub.id}
					iconOnly
					buttonText={`Archive ${pubTitle}`}
					variant="ghost"
					className={cn(
						"order-1 w-8 px-4 py-2 peer-data-[state=open]:opacity-100 [&_svg]:size-6",
						HOVER_CLASS
					)}
					icon={<Trash2 strokeWidth="1px" className="text-muted-foreground" />}
				/>
			) : (
				<span
					className={cn(
						"order-1 w-8 px-4 py-2 peer-data-[state=open]:opacity-100 [&_svg]:size-6",
						HOVER_CLASS
					)}
				></span>
			)}
			{canEdit ? (
				<Button
					variant="ghost"
					className={cn(
						"order-3 w-6 peer-data-[state=open]:opacity-100 [&_svg]:size-6",
						HOVER_CLASS
					)}
					asChild
				>
					<Link href={`/c/${communitySlug}/pubs/${pub.id}/edit`}>
						<Pencil strokeWidth="1px" className="text-muted-foreground" />
						<span className="sr-only">Update {pubTitle}</span>
					</Link>
				</Button>
			) : (
				<span
					className={cn(
						"order-3 w-6 peer-data-[state=open]:opacity-100 [&_svg]:size-6",
						HOVER_CLASS
					)}
				></span>
			)}
		</>
	)
}
