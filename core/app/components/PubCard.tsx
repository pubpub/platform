import { setTimeout } from "timers/promises";

import React, { Suspense } from "react";
import Link from "next/link";

import type { ProcessedPub } from "contracts";
import type { ActionInstances, UsersId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { Button } from "ui/button";
import { Card, CardDescription, CardFooter, CardTitle } from "ui/card";
import { Calendar, History, Pencil, Trash2 } from "ui/icon";
import { cn } from "utils";

import type { CommunityStage } from "~/lib/server/stages";
import Move from "~/app/c/[communitySlug]/stages/components/Move";
import { userCan, userCanEditPub } from "~/lib/authorization/capabilities";
import { formatDateAsMonthDayYear, formatDateAsPossiblyDistance } from "~/lib/dates";
import { getPubTitle } from "~/lib/pubs";
import { PubSelector } from "../c/[communitySlug]/pubs/PubSelector";
import { PubsRunActionDropDownMenu } from "./ActionUI/PubsRunActionDropDownMenu";
import { RelationsDropDown } from "./pubs/RelationsDropDown";
import { RemovePubButton } from "./pubs/RemovePubButton";
import { SkeletonButton } from "./skeletons/SkeletonButton";

// import { RemovePubButton } from "./pubs/RemovePubButton";

// TODO: https://github.com/pubpub/platform/issues/1200
const PubDescription = ({ pub }: { pub: ProcessedPub }) => {
	return null;
};

const HOVER_CLASS = "opacity-0 group-hover:opacity-100 transition-opacity duration-200";
// So that the whole card can be clickable as a link
const LINK_AFTER =
	"after:content-[''] after:z-0 after:absolute after:left-0 after:top-0 after:bottom-0 after:right-0";

export type PubCardProps = {
	pub: ProcessedPub<{
		withPubType: true;
		withRelatedPubs: false;
		withStage: true;
		withRelatedCounts: true;
	}>;
	communitySlug: string;
	moveFrom?: CommunityStage["moveConstraintSources"];
	moveTo?: CommunityStage["moveConstraints"];
	actionInstances?: ActionInstances[];
	withSelection?: boolean;
	userId: UsersId;
	/* if true, overrides the view stage capability check */
	canViewAllStages?: boolean;
	/* if true, overrides the edit pub capability check */
	canEditAllPubs?: boolean;
	/* if true, overrides the archive pub capability check */
	canArchiveAllPubs?: boolean;
	/* if true, overrides the run actions capability check */
	canRunActionsAllPubs?: boolean;
	/* if true, overrides the move pub capability check. dramatically reduces the number of queries for admins and editors and the like */
	canMoveAllPubs?: boolean;
};

export const PubCard = async ({
	pub,
	communitySlug,
	moveFrom,
	moveTo,
	actionInstances,
	withSelection = true,
	userId,
	canEditAllPubs,
	canArchiveAllPubs,
	canRunActionsAllPubs,
	canMoveAllPubs,
	canViewAllStages,
}: PubCardProps) => {
	const matchingValues = pub.matchingValues?.filter((match) => !match.isTitle);

	const showMatchingValues = matchingValues && matchingValues.length !== 0;
	const showDescription = "description" in pub && pub.description !== null && !showMatchingValues;
	const hasActions = pub.stage && actionInstances && actionInstances.length !== 0;
	return (
		<Card
			className="group relative flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 has-[[data-state=checked]]:border-blue-500"
			data-testid={`pub-card-${pub.id}`}
		>
			<div className="flex min-w-0 flex-1 flex-col space-y-[6px]">
				<div className="z-10 flex flex-row gap-2 p-0 font-semibold leading-4">
					{/* TODO: make filter by pub type */}
					<Button
						variant="outline"
						className="h-[22px] rounded border-gray-300 bg-gray-100 px-[.35rem] text-xs font-semibold shadow-none"
					>
						{pub.pubType.name}
					</Button>
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
						/>
					) : null}
					{pub.relatedPubsCount ? (
						<RelationsDropDown pubId={pub.id} numRelations={pub.relatedPubsCount} />
					) : null}
				</div>
				<CardTitle className="text-sm font-bold">
					<h3 className="min-w-0 truncate">
						<Link
							href={`/c/${communitySlug}/pubs/${pub.id}`}
							className={cn("hover:underline", LINK_AFTER)}
						>
							<div
								className="[&_mark]:bg-yellow-300"
								dangerouslySetInnerHTML={{ __html: getPubTitle(pub) }}
							/>
						</Link>
					</h3>
				</CardTitle>
				<CardDescription
					className={cn("m-0 min-w-0 truncate p-0", {
						hidden: showMatchingValues || !showDescription,
					})}
				>
					<PubDescription pub={pub} />
				</CardDescription>
				{showMatchingValues && (
					<div
						className={cn(
							"grid gap-1 text-xs text-gray-500 [grid-template-columns:minmax(0rem,auto)_minmax(0,1fr)]",
							"[&_mark]:bg-yellow-200"
						)}
					>
						{/* Matching values that aren't titles */}
						{matchingValues.map((match, idx) => (
							<React.Fragment key={idx}>
								<span className="font-medium">{match.name}:</span>
								<span
									dangerouslySetInnerHTML={{
										__html: match.highlights,
									}}
									className="font-light text-gray-600"
								/>
							</React.Fragment>
						))}
					</div>
				)}
				<CardFooter className="flex gap-2 p-0 text-xs text-gray-600">
					<div className="flex gap-1" title="Created at">
						<Calendar size="16px" strokeWidth="1px" className="text-neutral-500" />
						<span>{formatDateAsMonthDayYear(new Date(pub.createdAt))}</span>
					</div>
					<div className="flex gap-1" title="Updated at">
						<History size="16px" strokeWidth="1px" className="text-neutral-500" />
						<span>{formatDateAsPossiblyDistance(new Date(pub.updatedAt))}</span>
					</div>
				</CardFooter>
			</div>
			<div className="z-10 mr-4 w-fit flex-shrink-0">
				{/* We use grid and order-[x] to place items according to the design, but 
				PubsRunActionDropDownMenu needs to be first so it can have `peer`. The other
				buttons check if the `peer` is open, and if it is, it does not lose opacity.
				Otherwise, when the dropdown menu opens, the buttons all fade away */}
				<div
					className={cn(
						"grid w-fit items-center gap-3 text-neutral-500",
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
							actionInstances={actionInstances}
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
								"order-4 ml-2 box-content h-4 w-4 border-neutral-500 data-[state=checked]:opacity-100 peer-data-[state=open]:opacity-100",
								HOVER_CLASS
							)}
						/>
					) : null}
				</div>
			</div>
		</Card>
	);
};

const PubCardActions = async ({
	actionInstances,
	pub,
	communitySlug,
	userId,
	canEditAllPubs,
	canArchiveAllPubs,
	canRunActionsAllPubs,
}: {
	actionInstances?: ActionInstances[];
	pub: ProcessedPub<{
		withPubType: true;
		withRelatedPubs: false;
		withStage: true;
		withRelatedCounts: true;
	}>;
	communitySlug: string;
	userId: UsersId;
	canEditAllPubs?: boolean;
	canArchiveAllPubs?: boolean;
	canRunActionsAllPubs?: boolean;
}) => {
	const hasActions = pub.stage && actionInstances && actionInstances.length !== 0;
	const [canArchive, canRunActions, canEdit] = await Promise.all([
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
	]);

	return (
		<>
			{hasActions && canRunActions ? (
				<PubsRunActionDropDownMenu
					actionInstances={actionInstances}
					stage={pub.stage!}
					pubId={pub.id}
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
					buttonText="Archive"
					variant="ghost"
					className={cn(
						"order-1 w-8 px-4 py-2 peer-data-[state=open]:opacity-100 [&_svg]:size-6",
						HOVER_CLASS
					)}
					icon={<Trash2 strokeWidth="1px" className="text-neutral-500" />}
				/>
			) : null}
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
						<Pencil strokeWidth="1px" className="text-neutral-500" />
						<span className="sr-only">Update</span>
					</Link>
				</Button>
			) : null}
		</>
	);
};
