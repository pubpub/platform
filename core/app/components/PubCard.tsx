import Link from "next/link";

import type { ProcessedPub } from "contracts";
import type { ActionInstances } from "db/public";
import { Button } from "ui/button";
import { Card, CardDescription, CardFooter, CardTitle } from "ui/card";
import { Checkbox } from "ui/checkbox";
import { Calendar, ChevronDown, FlagTriangleRightIcon, History, Pencil, Trash2 } from "ui/icon";
import { cn } from "utils";

import type { CommunityStage } from "~/lib/server/stages";
import Move from "~/app/c/[communitySlug]/stages/components/Move";
import { formatDateAsMonthDayYear, formatDateAsPossiblyDistance } from "~/lib/dates";
import { getPubTitle } from "~/lib/pubs";
import { PubsRunActionDropDownMenu } from "./ActionUI/PubsRunActionDropDownMenu";
import { RemovePubButton } from "./pubs/RemovePubButton";

// TODO: https://github.com/pubpub/platform/issues/1200
const PubDescription = ({ pub }: { pub: ProcessedPub }) => {
	return null;
};

const HOVER_CLASS = "opacity-0 group-hover:opacity-100 transition-opacity duration-200";

export const PubCard = async ({
	pub,
	communitySlug,
	stages,
	actionInstances,
	withSelection = true,
}: {
	pub: ProcessedPub<{ withPubType: true; withRelatedPubs: false; withStage: true }>;
	communitySlug: string;
	stages: CommunityStage[];
	actionInstances: ActionInstances[];
	withSelection: boolean;
}) => {
	return (
		<Card
			className="group flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2"
			data-testid={`pub-card-${pub.id}`}
		>
			<div className="flex min-w-0 flex-col space-y-[6px]">
				<div className="flex flex-row gap-2 p-0 font-semibold leading-4">
					{/* TODO: make filter by pub type */}
					<Button
						variant="outline"
						className="h-[22px] rounded border-gray-300 bg-gray-100 px-[.35rem] text-xs font-semibold shadow-none"
					>
						{pub.pubType.name}
					</Button>
					{pub.stage ? (
						<Move
							pubId={pub.id}
							stageId={pub.stage.id}
							communityStages={stages}
							button={
								<Button
									variant="outline"
									className="h-[22px] gap-0.5 rounded-[104px] px-2 px-[.35rem] text-xs font-semibold shadow-none"
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
					<Button variant="outline" className="h-[22px] px-2 text-xs">
						Relations
						<ChevronDown strokeWidth="1px" />
					</Button>
				</div>
				<CardTitle className="text-[15px] font-bold">
					<h3 className="min-w-0 truncate">
						<Link
							href={`/c/${communitySlug}/pubs/${pub.id}`}
							className="hover:underline"
						>
							{getPubTitle(pub)}
						</Link>
					</h3>
				</CardTitle>
				<CardDescription className="min-w-0 truncate">
					<PubDescription pub={pub} />
				</CardDescription>
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
			<div className="mr-4">
				{/* We use grid and order-[x] to place items according to the design, but 
				PubsRunActionDropDownMenu needs to be first so it can have `peer`. The other
				buttons check if the `peer` is open, and if it is, it does not lose opacity.
				Otherwise, when the dropdown menu opens, the buttons all fade away */}
				<div className="grid grid-cols-4 items-center gap-3 text-neutral-500">
					{!withSelection ? <div className="col-span-1" /> : null}
					{pub.stage && actionInstances.length > 0 ? (
						<PubsRunActionDropDownMenu
							actionInstances={actionInstances}
							stage={pub.stage}
							pubId={pub.id}
							iconOnly
							variant="ghost"
							className={cn(
								"peer order-2 w-6 px-4 py-2 data-[state=open]:opacity-100 [&_svg]:size-6",
								HOVER_CLASS
							)}
						/>
					) : (
						<div className="col-span-1" />
					)}
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
					{withSelection ? (
						<Checkbox
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
