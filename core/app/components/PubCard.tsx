import React from "react";
import Link from "next/link";
import { Circle } from "lucide-react";

import type { ProcessedPub } from "contracts";
import type { ActionInstances } from "db/public";
import { Button } from "ui/button";
import { Card, CardDescription, CardFooter, CardTitle } from "ui/card";
import {
	Calendar,
	ChevronDown,
	FlagTriangleRightIcon,
	History,
	Pencil,
	Play,
	Trash2,
} from "ui/icon";
import { Separator } from "ui/separator";
import { cn } from "utils";

import type { CommunityStage } from "~/lib/server/stages";
import Move from "~/app/c/[communitySlug]/stages/components/Move";
import { formatDateAsMonthDayYear, formatDateAsPossiblyDistance } from "~/lib/dates";
import { getPubTitle } from "~/lib/pubs";
import { PubSelectorButton, PubSelectorCheckbox } from "../c/[communitySlug]/pubs/PubSelector";
import { PubsRunActionDropDownMenu } from "./ActionUI/PubsRunActionDropDownMenu";
import { PubCardActions } from "./PubCardActions";
import { RelationsDropDown } from "./pubs/RelationsDropDown";
import { RemovePubButton } from "./pubs/RemovePubButton";

// import { RemovePubButton } from "./pubs/RemovePubButton";

// TODO: https://github.com/pubpub/platform/issues/1200
const PubDescription = ({ pub }: { pub: ProcessedPub }) => {
	return null;
};

const HOVER_CLASS = "md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-200";
// So that the whole card can be clickable as a link
const LINK_AFTER =
	"after:content-[''] after:z-0 after:absolute after:left-0 after:top-0 after:bottom-0 after:right-0";

export const PubCard = async ({
	pub,
	communitySlug,
	moveFrom,
	moveTo,
	actionInstances,
	withSelection = true,
}: {
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
}) => {
	const matchingValues = pub.matchingValues?.filter((match) => !match.isTitle);

	const showMatchingValues = matchingValues && matchingValues.length !== 0;
	const showDescription = "description" in pub && pub.description !== null && !showMatchingValues;
	const hasActions = pub.stage && actionInstances && actionInstances.length !== 0;
	return (
		<Card
			className="group relative flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 has-[[data-state=checked]]:border-blue-500"
			data-testid={`pub-card-${pub.id}`}
		>
			<div className="flex w-full min-w-0 flex-1 grow flex-col space-y-[6px]">
				<div className="scrollbar-hide z-10 flex max-w-[90%] flex-row gap-2 overflow-scroll p-0 font-semibold leading-4">
					{/* TODO: make filter by pub type */}
					<Button
						variant="outline"
						className="h-[22px] flex-shrink-0 rounded border-gray-300 bg-gray-100 px-[.35rem] text-xs font-semibold shadow-none"
					>
						{pub.pubType.name}
					</Button>
					{pub.stage ? (
						<Move
							pubId={pub.id}
							stageId={pub.stage.id}
							moveFrom={moveFrom ?? []}
							moveTo={moveTo ?? []}
							button={
								<Button
									variant="outline"
									className="h-[22px] flex-shrink-0 gap-0.5 rounded-[104px] px-[.35rem] text-xs font-semibold shadow-none"
								>
									<FlagTriangleRightIcon
										strokeWidth="1px"
										className="text-neutral-500"
									/>
									{pub.stage.name}
									<ChevronDown strokeWidth="1px" />
								</Button>
							}
							hideIfNowhereToMove={false}
						/>
					) : null}
					{pub.relatedPubsCount ? (
						<RelationsDropDown pubId={pub.id} numRelations={pub.relatedPubsCount} />
					) : null}
				</div>
				<div className="pointer-events-none absolute right-8 top-0 z-10 h-6 w-8 bg-gradient-to-r from-transparent via-white to-white" />
				{/* </div>
			<div className="flex min-w-0 flex-1 flex-col space-y-[6px]"> */}
				<CardTitle className="text-sm font-bold">
					<h3 className="min-w-0 truncate">
						<Link
							href={`/c/${communitySlug}/pubs/${pub.id}`}
							className={cn("hover:underline [&_mark]:bg-yellow-300", LINK_AFTER)}
							dangerouslySetInnerHTML={{ __html: getPubTitle(pub) }}
						/>
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
									className={cn(
										"text-gray-600",
										// sm
										"sm:line-clamp-2",
										// md
										"md:line-clamp-none"
									)}
								/>
							</React.Fragment>
						))}
					</div>
				)}
				<CardFooter className="flex gap-2 p-0 text-xs text-gray-600">
					<div className="flex gap-1 text-nowrap" title="Created at">
						<Calendar size="16px" strokeWidth="1px" className="text-neutral-500" />
						<span>{formatDateAsMonthDayYear(new Date(pub.createdAt))}</span>
					</div>
					<div className="flex gap-1 text-nowrap" title="Updated at">
						<History size="16px" strokeWidth="1px" className="text-neutral-500" />
						<span>{formatDateAsPossiblyDistance(new Date(pub.updatedAt))}</span>
					</div>
				</CardFooter>
			</div>
			<div className="absolute right-0 top-0.5 z-10 w-fit md:static md:mr-4 lg:bg-gray-100">
				{/* We use grid and order-[x] to place items according to the design, but 
				PubsRunActionDropDownMenu needs to be first so it can have `peer`. The other
				buttons check if the `peer` is open, and if it is, it does not lose opacity.
				Otherwise, when the dropdown menu opens, the buttons all fade away */}
				<PubCardActions
					className={cn(
						withSelection && hasActions && "md:grid-cols-4",
						withSelection && !hasActions && "md:grid-cols-3",
						!withSelection && hasActions && "md:grid-cols-3",
						!withSelection && !hasActions && "md:grid-cols-2"
					)}
				>
					{hasActions ? (
						<PubsRunActionDropDownMenu
							actionInstances={actionInstances}
							stage={pub.stage!}
							pubId={pub.id}
							variant="ghost"
							className={cn(
								"bg-gray-100 py-6",
								// md
								"md:order-2 md:w-6 md:bg-transparent md:px-4 md:py-2 md:peer-data-[state=open]:opacity-100 md:[&_svg]:size-6",
								HOVER_CLASS
							)}
						>
							{/* md */}
							<div className="hidden md:block">
								<span className="sr-only">Run action</span>
								<Play strokeWidth="1px" className="text-neutral-500" />
							</div>
							{/* sm */}
							<div className="flex w-full items-center justify-start gap-2 text-lg text-neutral-500 md:hidden">
								<Play size="12" strokeWidth="1px" className="text-neutral-500" />
								<span>Run action</span>
							</div>
						</PubsRunActionDropDownMenu>
					) : null}
					<Button
						variant="ghost"
						asChild
						className={cn(
							"flex items-center justify-start bg-gray-100 py-6 text-lg text-neutral-500",
							// md
							"md:order-3 md:h-8 md:w-6 md:bg-transparent md:py-0 md:peer-data-[state=open]:opacity-100 md:[&_svg]:size-6",
							HOVER_CLASS
						)}
					>
						<Link href={`/c/${communitySlug}/pubs/${pub.id}/edit`}>
							<Pencil strokeWidth="1px" className="text-neutral-500" />
							<span className="text-lg md:sr-only">Update</span>
						</Link>
					</Button>
					{withSelection ? (
						<>
							{/* md */}
							<div className="hidden items-center justify-center rounded-md px-1 py-2 hover:bg-white md:order-4 md:flex">
								<PubSelectorCheckbox
									pubId={pub.id}
									className={cn(
										"justify-start bg-gray-100",
										"order-4 h-4 w-4 border-neutral-500 bg-transparent p-1 data-[state=checked]:opacity-100 peer-data-[state=open]:opacity-100",
										HOVER_CLASS
									)}
								/>
							</div>
							{/* sm */}
							<PubSelectorButton
								pubId={pub.id}
								className="flex w-full items-center justify-start bg-gray-100 py-6 text-lg text-neutral-500 md:hidden"
							>
								<Circle strokeWidth="1px" className="text-neutral-500" /> Select Pub
							</PubSelectorButton>
						</>
					) : null}

					<RemovePubButton
						pubId={pub.id}
						buttonText="Archive"
						variant="ghost"
						className={cn(
							"justify-start bg-red-100 py-6 text-lg text-red-500 hover:[&_svg]:stroke-red-500",
							//md
							"md:order-1 md:w-8 md:bg-transparent md:px-4 md:py-2 md:hover:bg-red-100 md:hover:text-red-500 md:peer-data-[state=open]:opacity-100 md:[&_span]:hidden md:[&_svg]:size-6",
							HOVER_CLASS
						)}
						icon={<Trash2 strokeWidth="1px" className="hover:text-green-500" />}
					/>
				</PubCardActions>
			</div>
		</Card>
	);
};
