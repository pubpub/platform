import Link from "next/link";

import type { ProcessedPub } from "contracts";
import type { ActionInstances } from "db/public";
import { Button } from "ui/button";
import { Card, CardDescription, CardFooter, CardTitle } from "ui/card";
import { Checkbox } from "ui/checkbox";
import { Calendar, ChevronDown, FlagTriangleRightIcon, History, Pencil, Trash2 } from "ui/icon";

import type { CommunityStage } from "~/lib/server/stages";
import Move from "~/app/c/[communitySlug]/stages/components/Move";
import { formatDateAsPossiblyDistance } from "~/lib/dates";
import { getPubTitle } from "~/lib/pubs";
import { PubsRunActionDropDownMenu } from "./ActionUI/PubsRunActionDropDownMenu";
import { RemovePubButton } from "./pubs/RemovePubButton";

// TODO: https://github.com/pubpub/platform/issues/1200
const PubDescription = ({ pub }: { pub: ProcessedPub }) => {
	return null;
};

const Action = ({ icon, title, link }: { icon: React.ReactNode; title: string; link?: string }) => {
	const iconWithTitle = (
		<>
			{icon}
			<span className="sr-only">{title}</span>
		</>
	);
	const inner = link ? <Link href={link}>{iconWithTitle}</Link> : iconWithTitle;
	return (
		<Button variant="ghost" className="w-6 [&_svg]:size-6" asChild={!!link}>
			{inner}
		</Button>
	);
};

export const PubCard = async ({
	pub,
	communitySlug,
	stages,
	actionInstances,
}: {
	pub: ProcessedPub<{ withPubType: true; withRelatedPubs: false; withStage: true }>;
	communitySlug: string;
	stages: CommunityStage[];
	actionInstances: ActionInstances[];
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
						<span>{formatDateAsPossiblyDistance(new Date(pub.createdAt))}</span>
					</div>
					<div className="flex gap-1" title="Updated at">
						<History size="16px" strokeWidth="1px" className="text-neutral-500" />
						<span>{formatDateAsPossiblyDistance(new Date(pub.updatedAt))}</span>
					</div>
				</CardFooter>
			</div>
			<div className="mr-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
				<div className="flex items-center gap-3 text-neutral-500">
					<RemovePubButton
						pubId={pub.id}
						iconOnly
						buttonText="Archive"
						variant="ghost"
						className="w-8 px-4 py-2 [&_svg]:size-6"
						icon={<Trash2 strokeWidth="1px" className="text-neutral-500" />}
					/>
					{pub.stage ? (
						<PubsRunActionDropDownMenu
							actionInstances={actionInstances}
							stage={pub.stage}
							pubId={pub.id}
							iconOnly
							variant="ghost"
							className="w-6 px-4 py-2 [&_svg]:size-6"
						/>
					) : null}
					<Action
						link={`/c/${communitySlug}/pubs/${pub.id}/edit`}
						icon={<Pencil strokeWidth="1px" className="text-neutral-500" />}
						title="Update"
					/>
					<Checkbox className="ml-2 box-content h-4 w-4 border-neutral-500" />
				</div>
			</div>
		</Card>
	);
};
